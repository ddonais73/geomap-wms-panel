import React, { PureComponent } from 'react';
// import { stylesFactory } from '@grafana/ui';
import { /*DataFrame,*/ Field, formattedValueToString, getFieldDisplayName, GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { GeomapHoverPayload } from 'event';
import { config } from '@grafana/runtime';
import tinycolor from 'tinycolor2';

// export interface Props {
//   data?: DataFrame; // source data
//   rowIndex?: number; // the hover row
//   columnIndex?: number; // the hover column
//   propsToShow?: any;
//   icon?: string;
//   titleField?: any;
//   timeField?: any;
// }

// export class DataHoverView extends PureComponent<Props> {
interface DataHoverViewProps extends GeomapHoverPayload {
  onStationLinkClick?: () => void;
}

export class DataHoverView extends PureComponent<DataHoverViewProps> {
  style = getStyles(config.theme2);

  render() {
    const {
      data,
      rowIndex,
      columnIndex,
      propsToShow,
      timeField,
      titleField,
      icon,
      stationLinks,
      tooltipImageUrl,
      tooltipImageBackgroundColor,
      tooltipImageBackgroundOpacity,
      onStationLinkClick,
    } = this.props;
    const imageWrapStyle = getImageWrapStyle(tooltipImageBackgroundColor, tooltipImageBackgroundOpacity);

    if (!data || rowIndex == null) {
      return null;
    }
    if (propsToShow && propsToShow.length > 1) {
      return (
        <div className={this.style.infoWrap}>
          {(titleField ?? []).map((f: Field<any>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`}>
              <div className={this.style.singleDisplay}>
                <h5>
                  <i className={'fa ' + icon + ' ' + this.style.icon} />
                  {fmt(f, rowIndex)}
                </h5>
              </div>
            </div>
          ))}
          {propsToShow.map((f: Field<any>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`} className={this.style.row}>
              <span style={{whiteSpace: "pre"}}>{getFieldDisplayName(f, data)}: </span>
              <span>{fmt(f, rowIndex)}</span>
            </div>
          ))}
          {tooltipImageUrl && (
            <div className={this.style.imageWrap} style={imageWrapStyle}>
              <img className={this.style.image} src={tooltipImageUrl} alt="Location" />
            </div>
          )}
          {Boolean(stationLinks?.length) && (
            <div className={this.style.linksBlock}>
              {stationLinks!.map((link, idx) => (
                <a
                  key={`${idx}/${rowIndex}/${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={this.style.link}
                  onClick={() => onStationLinkClick?.()}
                >
                  {link.name}
                </a>
              ))}
            </div>
          )}
        </div>
      );
    } else if (propsToShow) {
      return (
        <div className={this.style.infoWrap}>
          {propsToShow.map((f: Field<any>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`} className={i === columnIndex ? this.style.highlight : ''}>
              <div className={this.style.singleDisplay}>
                <h5>{getFieldDisplayName(f, data)}</h5>
              </div>
              <div className={this.style.singleDisplay}>
                <h1>
                  <i className={'fa ' + icon + ' ' + this.style.icon} />
                  {fmt(f, rowIndex)}
                </h1>
              </div>
            </div>
          ))}
          {(timeField ?? []).map((f: Field<any>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`} className={this.style.rightDisplay}>
              <h6>{fmt(f, rowIndex)}</h6>
            </div>
          ))}
          {(titleField ?? []).map((f: Field<any>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`} className={this.style.rightDisplay}>
              <h6>{fmt(f, rowIndex)}</h6>
            </div>
          ))}
          {tooltipImageUrl && (
            <div className={this.style.imageWrap} style={imageWrapStyle}>
              <img className={this.style.image} src={tooltipImageUrl} alt="Location" />
            </div>
          )}
          {Boolean(stationLinks?.length) && (
            <div className={this.style.linksBlock}>
              {stationLinks!.map((link, idx) => (
                <a
                  key={`${idx}/${rowIndex}/${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={this.style.link}
                  onClick={() => onStationLinkClick?.()}
                >
                  {link.name}
                </a>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className={this.style.infoWrap}>
          {(timeField ?? []).map((f: Field<any>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`} className={this.style.rightDisplay}>
              <h6>{fmt(f, rowIndex)}</h6>
            </div>
          ))}
          {(titleField ?? []).map((f: Field<any>, i: number | undefined) => (
            <div key={`${i}/${rowIndex}`} className={this.style.rightDisplay}>
              <h6>{fmt(f, rowIndex)}</h6>
            </div>
          ))}
          {tooltipImageUrl && (
            <div className={this.style.imageWrap} style={imageWrapStyle}>
              <img className={this.style.image} src={tooltipImageUrl} alt="Location" />
            </div>
          )}
          {Boolean(stationLinks?.length) && (
            <div className={this.style.linksBlock}>
              {stationLinks!.map((link, idx) => (
                <a
                  key={`${idx}/${rowIndex}/${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={this.style.link}
                  onClick={() => onStationLinkClick?.()}
                >
                  {link.name}
                </a>
              ))}
            </div>
          )}
        </div>
      );
    }
  }
}

function fmt(field: Field, row: number): string {
  const v = field.values[row];
  if (field.display) {
    return formattedValueToString(field.display(v));
  }
  return `${v}`;
}

function getImageWrapStyle(color?: string, opacity?: number): React.CSSProperties | undefined {
  if (!color) {
    return undefined;
  }

  const alpha = Math.max(0, Math.min(1, opacity ?? 0));
  return {
    backgroundColor: tinycolor(color).setAlpha(alpha).toRgbString(),
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  infoWrap: css`
    padding: 0px;
    div {
      font-weight: ${theme.typography.fontWeightMedium};
      // padding: ${theme.spacing(0.25, 2)};
    }
  `,
  row: css`
    padding: 2px;
    display: flex;
    justify-content: space-between;
  `,
  linksBlock: css`
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  imageWrap: css`
    margin-top: 8px;
    text-align: center;
  `,
  image: css`
    width: 128px;
    height: 128px;
    object-fit: contain;
  `,
  link: css`
    text-decoration: underline;
    word-break: break-word;
  `,
  highlight: css`
    background: ${theme.colors.action.hover};
  `,
  singleDisplay: css`
    text-align: center;
    h1 {
      font-size: 3.5rem;
      font-weight: ${theme.typography.fontWeightBold};
      margin: 0px;
    }
  `,
  rightDisplay: css`
    padding-top: 0px;
    padding-bottom: 0px;
    text-align: right;
    h6 {
      font-height: 1;
      margin: 0px;
    }
  `,
  leftDisplay: css`
    text-align: left;
  `,
  icon: css`
    margin-right: 5px;
  `,
});
