import { DataFrame, Field } from '@grafana/data';
import stationLinksData from '../../station_links.json';

export interface StationUrlLink {
  name: string;
  url: string;
}

interface StationSiteRecord {
  location: string;
  latitude: number;
  longitude: number;
  urls: StationUrlLink[];
}

interface StationLinksFile {
  site: StationSiteRecord[];
}

const parsedStationLinks = normalizeStationLinks(stationLinksData as StationLinksFile);

function normalizeStationLinks(rawData: StationLinksFile): StationSiteRecord[] {
  if (!rawData || !Array.isArray(rawData.site)) {
    return [];
  }

  return rawData.site
    .filter((site) => !!site && typeof site.location === 'string' && Array.isArray(site.urls))
    .map((site) => ({
      location: site.location,
      latitude: Number(site.latitude),
      longitude: Number(site.longitude),
      urls: site.urls
        .filter((link) => !!link && typeof link.name === 'string' && typeof link.url === 'string')
        .map((link) => ({
          name: link.name,
          url: link.url,
        })),
    }));
}

function findFieldByName(frame: DataFrame, names: string[]): Field | undefined {
  const normalizedNames = new Set(names.map((name) => name.toLowerCase()));
  return frame.fields.find((field) => normalizedNames.has(field.name.toLowerCase()));
}

function toLinks(value: unknown): StationUrlLink[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .filter((entry) => !!entry && typeof entry.name === 'string' && typeof entry.url === 'string')
      .map((entry) => ({ name: entry.name, url: entry.url }));
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return toLinks(parsed);
    } catch {
      return [];
    }
  }

  return [];
}

function getFieldValue<T>(field: Field | undefined, rowIndex: number): T | undefined {
  if (!field || rowIndex < 0 || rowIndex >= field.values.length) {
    return undefined;
  }

  return field.values[rowIndex] as T;
}

function byLocation(location: string): StationUrlLink[] {
  const key = location.trim().toLowerCase();
  const site = parsedStationLinks.find((entry) => entry.location.trim().toLowerCase() === key);
  return site?.urls ?? [];
}

function byCoordinates(lat: number, lon: number): StationUrlLink[] {
  const tolerance = 0.0005;
  const site = parsedStationLinks.find(
    (entry) => Math.abs(entry.latitude - lat) <= tolerance && Math.abs(entry.longitude - lon) <= tolerance
  );
  return site?.urls ?? [];
}

export function getStationLinks(frame: DataFrame, rowIndex: number): StationUrlLink[] {
  if (!frame || rowIndex == null) {
    return [];
  }

  const urlsField = findFieldByName(frame, ['urls', 'links', 'station_links']);
  const fromField = toLinks(getFieldValue(urlsField, rowIndex));
  if (fromField.length > 0) {
    return fromField;
  }

  const locationField = findFieldByName(frame, ['location', 'site', 'station', 'name']);
  const location = getFieldValue<string>(locationField, rowIndex);
  if (typeof location === 'string') {
    const fromLocation = byLocation(location);
    if (fromLocation.length > 0) {
      return fromLocation;
    }
  }

  const latField = findFieldByName(frame, ['latitude', 'lat']);
  const lonField = findFieldByName(frame, ['longitude', 'lon', 'lng']);
  const lat = Number(getFieldValue<number>(latField, rowIndex));
  const lon = Number(getFieldValue<number>(lonField, rowIndex));
  if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
    return byCoordinates(lat, lon);
  }

  return [];
}
