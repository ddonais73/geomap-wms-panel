import { FeatureLike } from 'ol/Feature';
import { SimpleGeometry } from 'ol/geom';
import { Layer } from 'ol/layer';
import { DataHoverPayload } from '@grafana/data';
import { Source } from 'ol/source';
import { StationUrlLink } from 'utils/stationLinks';

export interface GeomapHoverFeature {
  feature: FeatureLike;
  layer: Layer<Source>;
  geo: SimpleGeometry;
}

export interface GeomapHoverPayload extends DataHoverPayload {
  features?: GeomapHoverFeature[];
  propsToShow?: any[]; // any
  titleField?: any[]; // string
  timeField?: any[]; // string
  icon?: string;
  stationLinks?: StationUrlLink[];
  markerLabel?: string;
  tooltipImageUrl?: string;
  pageX: number;
  pageY: number;
}
