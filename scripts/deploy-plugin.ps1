param(
  [string]$HostName = "acadiaengineering.ca",
  [int]$Port = 22,
  [string]$RemoteRoot = "/opt/felixrelleum-geomapmultiurl-panel",
  [string]$PluginDistDir = "felixrelleum-geomapmultiurl-panel",
  [string]$Username,
  [securestring]$Password,
  [string]$PlainPassword,
  [switch]$SkipBuild,
  [switch]$InstallPoshSSH,
  [string]$GrafanaRestartCommand = "docker restart grafana"
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $scriptDir "..")
Set-Location $projectRoot

if ([string]::IsNullOrWhiteSpace($Username)) {
  $Username = if ($env:SFTP_USERNAME) { $env:SFTP_USERNAME } else { Read-Host "SFTP username" }
}

if (-not $Password) {
  if (-not [string]::IsNullOrWhiteSpace($PlainPassword)) {
    $Password = ConvertTo-SecureString $PlainPassword -AsPlainText -Force
  } elseif (-not [string]::IsNullOrWhiteSpace($env:SFTP_PASSWORD)) {
    $Password = ConvertTo-SecureString $env:SFTP_PASSWORD -AsPlainText -Force
  } else {
    $Password = Read-Host "SFTP password" -AsSecureString
  }
}

if (-not $SkipBuild) {
  Write-Host "Building plugin..." -ForegroundColor Cyan
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) {
    throw "Build failed with exit code $LASTEXITCODE"
  }
}

if ($InstallPoshSSH) {
  Write-Host "Installing/Updating Posh-SSH module..." -ForegroundColor Cyan
  Install-Module -Name Posh-SSH -Scope CurrentUser -Force -AllowClobber
}

Import-Module Posh-SSH

$localRoot = Resolve-Path $PluginDistDir
if (-not (Test-Path $localRoot)) {
  throw "Plugin dist folder '$PluginDistDir' not found in $projectRoot"
}

$credential = New-Object System.Management.Automation.PSCredential($Username, $Password)

Write-Host "Connecting to SFTP $HostName`:$Port..." -ForegroundColor Cyan
$session = New-SFTPSession -ComputerName $HostName -Port $Port -Credential $credential -AcceptKey
if (-not $session) {
  throw "Could not create SFTP session"
}

$sessionId = $session.SessionId
$sshSession = $null
$sshSessionId = $null

try {
  $directories = @('') + (
    Get-ChildItem -Path $localRoot -Recurse -Directory |
      ForEach-Object {
        $_.FullName.Substring($localRoot.Path.Length).TrimStart('\\').Replace('\\', '/')
      }
  )

  foreach ($relativeDir in $directories) {
    $remoteDir = if ([string]::IsNullOrWhiteSpace($relativeDir)) {
      $RemoteRoot
    } else {
      "$RemoteRoot/$relativeDir"
    }

    try {
      New-SFTPItem -SessionId $sessionId -Path $remoteDir -ItemType Directory -ErrorAction Stop | Out-Null
    } catch {
      # ignore existing directories
    }
  }

  $files = Get-ChildItem -Path $localRoot -Recurse -File
  foreach ($file in $files) {
    $relativeFile = $file.FullName.Substring($localRoot.Path.Length).TrimStart('\\').Replace('\\', '/')
    $remoteDir = Split-Path -Path $relativeFile -Parent
    $destination = if ([string]::IsNullOrWhiteSpace($remoteDir)) {
      $RemoteRoot
    } else {
      "$RemoteRoot/$($remoteDir.Replace('\\', '/'))"
    }

    Set-SFTPItem -SessionId $sessionId -Path $file.FullName -Destination $destination -Force -ErrorAction Stop
  }

  Write-Host "Upload complete. Files uploaded: $($files.Count)" -ForegroundColor Green

  Write-Host "Restarting Grafana container..." -ForegroundColor Cyan
  $sshSession = New-SSHSession -ComputerName $HostName -Port $Port -Credential $credential -AcceptKey
  if (-not $sshSession) {
    throw "Could not create SSH session for Grafana restart"
  }

  $sshSessionId = $sshSession.SessionId
  $restartResult = Invoke-SSHCommand -SessionId $sshSessionId -Command $GrafanaRestartCommand
  if ($restartResult.ExitStatus -ne 0) {
    throw "Grafana restart command failed (exit $($restartResult.ExitStatus)): $($restartResult.Error)"
  }

  Write-Host "Grafana restart complete." -ForegroundColor Green
} finally {
  if ($sessionId) {
    Remove-SFTPSession -SessionId $sessionId | Out-Null
  }
  if ($sshSessionId) {
    Remove-SSHSession -SessionId $sshSessionId | Out-Null
  }
}
