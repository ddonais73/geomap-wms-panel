import { GeomapHoverPayload } from "event";
import { DataHoverView } from "./DataHoverView";
import React, { memo, useEffect, useRef } from 'react';
import { ClipboardButton, useTheme2, VizTooltipContainer } from "@grafana/ui";
import { css } from "@emotion/css";
import { computeTooltipStyle, convertMapViewExtent2LonLat, copy2ClipBoardDataAsJSON, MapViewExtentLonLat, TooltipStyle } from "./tootltipUtils";
import { Size } from "ol/size";

type Props = {
    tooltipData: {
        ttip?: GeomapHoverPayload;
        fixedFlag?: boolean;
    }
    mapExtent?: {
        extent: number[];
        projection: string;
    }
    mapSize: Size | undefined;
    onClose?: () => void;
    openLinksInNewTab?: boolean;
};

export const Tooltip = memo(function Tooltip({tooltipData, mapExtent, mapSize, onClose, openLinksInNewTab = false}: Props) {
    const theme = useTheme2();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canRenderTooltip = Boolean(
        tooltipData.ttip &&
        tooltipData.ttip.data &&
        mapExtent &&
        mapSize &&
        mapSize.length === 2 &&
        mapExtent.extent.length === 4 &&
        mapExtent.projection.length > 0 &&
        tooltipData.ttip.point &&
        tooltipData.ttip.point.lat &&
        tooltipData.ttip.point.lon
    );

    useEffect(() => {
        if (!tooltipData.fixedFlag || !tooltipData.ttip?.data || !onClose) {
            return;
        }

        const handleDocumentMouseDown = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (!target) {
                return;
            }

            if (containerRef.current?.contains(target)) {
                return;
            }

            onClose();
        };

        document.addEventListener('mousedown', handleDocumentMouseDown, true);
        return () => document.removeEventListener('mousedown', handleDocumentMouseDown, true);
    }, [tooltipData.fixedFlag, tooltipData.ttip?.data, onClose]);

    if (!canRenderTooltip) {
        return null;
    }
    const ttip = tooltipData.ttip!;
    const safeMapExtent = mapExtent!;
    const safeMapSize = mapSize!;
    const datahoverview = (<DataHoverView {...ttip} onStationLinkClick={onClose} openLinksInNewTab={openLinksInNewTab} />);

    let extentLonLat: MapViewExtentLonLat;
    try {
            extentLonLat = convertMapViewExtent2LonLat(safeMapExtent.extent, safeMapExtent.projection);
    } catch (error) {
        return null;
    }

    let vizTooltipStyle: TooltipStyle;
    try {
        vizTooltipStyle = computeTooltipStyle(
            (ttip.point as unknown) as { lon: number; lat: number; },
            extentLonLat,
            safeMapSize
        );
    } catch (error) {
        return null;
    }

    if (tooltipData.fixedFlag) {
        vizTooltipStyle = {
            ...vizTooltipStyle,
            borderStyle: "solid",
            borderWidth: "2px",
            // borderRadius: theme.shape.radius.sm,
            borderColor: theme.colors.border.strong
        }
    }

    return (
        <div ref={containerRef}>
            <VizTooltipContainer
            className={styles.viz}
            style={vizTooltipStyle}
            position={{ x: ttip.pageX, y: ttip.pageY }}
            offset={{ x: 10, y: 10 }}
            allowPointerEvents
            >
            {datahoverview}
            {(tooltipData.fixedFlag && (ttip.propsToShow ?? []).length > 0) && (
                    <ClipboardButton icon="copy" variant="secondary" size="sm"
                    getText={() => copy2ClipBoardDataAsJSON(ttip)} fullWidth={true}>
                        Copy data
                    </ClipboardButton>
                )
            }
            </VizTooltipContainer>
        </div>
    );
}, (prevProps, nextProps) => {
    const changed = Object.is(prevProps.tooltipData.ttip?.data, nextProps.tooltipData.ttip?.data)
    && Object.is(prevProps.tooltipData.ttip?.features, nextProps.tooltipData.ttip?.features)
    && (nextProps.tooltipData.fixedFlag === prevProps.tooltipData.fixedFlag)
    && (nextProps.openLinksInNewTab === prevProps.openLinksInNewTab);
    return changed;
});

const styles = {
    viz: css({
        borderRadius: "2px",
  }),
};
