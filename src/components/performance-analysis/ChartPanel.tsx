import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePrometheusRangeQuery, type PrometheusSeries } from '../../hooks/usePrometheusRangeQuery';
import { parser } from '@prometheus-io/lezer-promql';
import uPlot, { type AlignedData, type Options } from 'uplot';
import UplotReact from 'uplot-react';
import 'uplot/dist/uPlot.min.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { IconButton, Box } from '@mui/material';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import { type QueryObject as StoreQueryObject } from '../../store/dashboardSlice';

const colorPalette = [
    '#7EB26D', // green
    '#EAB839', // yellow
    '#6ED0E0', // cyan
    '#EF843C', // orange
    '#E24D42', // red
    '#1F78C1', // blue
    '#BA43A9', // purple
    '#705DA0', // dark purple
];

const hexToRgba = (hex: string, alpha: number): string => {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        return `rgba(0, 0, 0, ${alpha})`; // fallback for invalid hex
    }
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatScientific = (value: number, resolution: number): string => {
    if (value === 0) return `0.${'0'.repeat(resolution)}`; // Handle zero case

    const suffixes: { [key: string]: string } = {
        '4': 'T', '3': 'G', '2': 'M', '1': 'K', '0': '',
        '-1': 'm', '-2': 'μ', '-3': 'n', '-4': 'p'
    };

    const sign = value < 0 ? "-" : "";
    const absValue = Math.abs(value);
    
    if (absValue === 0) return `0.${'0'.repeat(resolution)}`;
    
    const order = Math.floor(Math.log10(absValue) / 3);
    const normalizedValue = absValue / Math.pow(10, order * 3);
    
    const suffix = suffixes[order.toString()] || '';
    return `${sign}${normalizedValue.toFixed(resolution)}${suffix}`;
};

/**
 * Adds an instance filter to a PromQL query using the lezer parser
 * @param query - The original PromQL query
 * @param instanceId - The instance ID to filter by
 * @returns Modified query with instance filter
 */
const addInstanceFilterToQuery = (query: string, instanceId: string): string => {
    if (!instanceId || instanceId === 'observability-node') {
        return query;
    }

    try {
        const newLabel = `instance="${instanceId}"`;
        
        // Parse the query using the lezer parser
        const tree = parser.parse(query);
        const cursor = tree.cursor();
        
        // Collect edits to apply to the query
        const edits: Array<{ from: number; to: number; insert: string }> = [];
        
        do {
            // Look for VectorSelector nodes (metric names with potential label matchers)
            if (cursor.name === "VectorSelector") {
                // Get the text of this specific node
                const nodeText = query.slice(cursor.from, cursor.to);
                
                // Check if instance label already exists
                if (nodeText.includes('instance=')) {
                    continue; // Skip if instance filter already exists
                }
                
                // Case A: The metric already has braces -> metric_name{existing="value"}
                // We find the closing brace '}' and insert before it
                if (nodeText.includes('{')) {
                    const closingBraceIndex = cursor.from + nodeText.lastIndexOf('}');
                    edits.push({
                        from: closingBraceIndex,
                        to: closingBraceIndex,
                        insert: `,${newLabel}`
                    });
                } 
                // Case B: The metric has NO braces -> metric_name
                // We find the end of the word and append the full brace set
                else {
                    edits.push({
                        from: cursor.to,
                        to: cursor.to,
                        insert: `{${newLabel}}`
                    });
                }
            }
        } while (cursor.next());
        
        // Apply edits in reverse order to preserve indices
        edits.sort((a, b) => b.from - a.from);
        
        let modifiedQuery = query;
        for (const edit of edits) {
            modifiedQuery = 
                modifiedQuery.slice(0, edit.from) + 
                edit.insert + 
                modifiedQuery.slice(edit.to);
        }
        
        return modifiedQuery;
    } catch (error) {
        console.warn('Failed to parse PromQL query, returning original:', error);
        return query;
    }
};

const formatScientific_old = (value: number, resolution: number): string => {
    if (value === 0) return `0.${'0'.repeat(resolution)}`; // Handle zero case

    const suffixes: { [key: number]: string } = {
        '4': 'T', '3': 'G', '2': 'M', '1': 'K', '0': '',
        '-1': 'm', '-2': 'μ', '-3': 'n', '-4': 'p'
    };

    const sign = value < 0 ? "-" : "";
    const absValue = Math.abs(value);
    
    const tier = Math.floor(Math.log10(absValue) / 3);

    if (suffixes[tier]) {
        const suffix = suffixes[tier] || '';
        const scale = Math.pow(10, tier * 3);
        const scaledValue = absValue / scale;
        return sign + scaledValue.toFixed(resolution) + suffix;
    }

    return value.toFixed(resolution);
};

/**
 * Creates a uPlot-compatible AlignedData array from an array of Prometheus series.
 * It assumes all series share the same timestamps from the first series.
 * NOTE: For series with different timestamps, a more sophisticated joining/merging strategy would be needed.
 */
const toAlignedData = (series: PrometheusSeries[]): AlignedData => {
    if (!series || series.length === 0) {
        return [[], []];
    }

    const timestamps = series[0].timestamps;
    const values = series.map(s => s.values);

    return [timestamps, ...values];
};

/**
 * Generates a compact display label for a series for the legend.
 * e.g., {__name__: "metric", instance: "localhost:9090", ...} -> "metric{instance="localhost:9090"}"
 */
const generateLegendLabel = (metric: Record<string, string>): string => {
    const name = metric.__name__ || '';
    const labels = Object.entries(metric)
        .filter(([key]) => key !== '__name__' && key !== 'query') // Exclude verbose labels
        .map(([key, value]) => `${key}="${value}"`)
        .join(', ');
    return `${name}${labels ? `{${labels}}` : ''}`;
};

type QueryObjectWithVisibility = {
    id: string;
    query: string;
    visible: boolean;
    series: StoreQueryObject['series'];
};

const ChartPanel = ({
    query,
    title,
    refreshTrigger,
    timeRange,
    instanceId,
    instanceDetails,
    // data, // @TODO: remove this prop to make it fully controlled by query
    onDataFetched,
}: {
    query: (string[] | QueryObjectWithVisibility[] | StoreQueryObject[]),
    title: string,
    refreshTrigger?: number,
    timeRange?: number, // Time range in minutes
    instanceId?: string,
    instanceDetails?: any,
    // data: PrometheusSeries[], // @TODO: remove this prop to make it fully controlled by query
    onDataFetched?: (data: PrometheusSeries[] | null) => void
}) => {
    // This useMemo hook normalizes the `query` prop into a format suitable for usePrometheusRangeQuery, using stable IDs
    const visibleQueries = useMemo(() => {
        if (!query || query.length === 0) {
            return [];
        }
        
        let processedQueries: { id: string; query: string }[] = [];
        const firstQuery = query[0];
        
        if (typeof firstQuery === 'string') {
            // Assign a temporary ID for fetching, but this won't be stable across refreshes/reorders
            processedQueries = (query as string[]).map((q, i) => ({ id: `temp-${i}-${q}`, query: q }));
        } else if ('visible' in firstQuery) {
            // Handle object array from EditPanelPage with visibility flags
            processedQueries = (query as QueryObjectWithVisibility[]).filter(q => q.visible).map(q => ({ id: q.id, query: q.query }));
        } else if ('series' in firstQuery) {
            // Handle object array from Dashboard page (from Redux store)
            processedQueries = (query as StoreQueryObject[]).map(q => ({ id: q.id, query: q.query }));
        }
        
        // Apply instance filtering if instanceId is available
        if (instanceId && processedQueries.length > 0) {
            return processedQueries.map(q => ({
                ...q,
                query: addInstanceFilterToQuery(q.query, instanceId)
            }));
        }
        
        return processedQueries;
    }, [query, instanceId]);
 

    const { data: seriesData, loading, error } = usePrometheusRangeQuery(visibleQueries, refreshTrigger, timeRange);
    // const { data: seriesData, loading, error } ={ data  , loading:false, error:null}; // @TODO: remove this prop to make it fully controlled by query



    // This effect passes the fetched data up to the parent component.
    useEffect(() => {
        if (onDataFetched) {
            onDataFetched(seriesData);
        }
    }, [seriesData, onDataFetched]);
    // Convert the structured series data into the flat array format uPlot expects.
    const alignedData = useMemo(() => (seriesData ? toAlignedData(seriesData) : null), [seriesData]);

    const containerRef = useRef<HTMLDivElement>(null);
    const legendContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<uPlot | null>(null);
    const [size, setSize] = useState({ width: 0, height: 0 }); 
    const [tooltipState, setTooltipState] = useState<{
        show: boolean;
        left: number;
        top: number;
        content: string;
    }>({ show: false, left: 0, top: 0, content: '' });
    const [isZoomed, setIsZoomed] = useState(false);
    const initialXRange = useRef<{ min: number; max: number } | null>(null);

    // This effect observes the container's size and updates the state
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                // The contentRect already accounts for the container's padding.
                setSize({ width, height });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // This effect adds horizontal mouse wheel scrolling to the legend
    useEffect(() => {
        const legendEl = legendContainerRef.current;
        if (!legendEl) return;

        const handleWheel = (event: WheelEvent) => {
            if (event.deltaY === 0) return;
            // Prevent the default vertical page scroll
            event.preventDefault();
            // Apply the vertical scroll delta to the horizontal scroll position, with a multiplier for speed
            legendEl.scrollLeft += event.deltaY * 3;
        };

        legendEl.addEventListener('wheel', handleWheel, { passive: false });
        return () => legendEl.removeEventListener('wheel', handleWheel);
    }, []);

    const handleResetZoom = useCallback(() => {
        if (chartRef.current && alignedData) {
            // uPlot's setData with a second argument of `true` resets scales to auto-range over the data.
            chartRef.current.setData(alignedData, true);
            setIsZoomed(false);
        }
    }, [alignedData]);

    const handleSetCursor = useCallback((u: uPlot) => {  
        // Check if cursor is outside the plot
        if (!u.cursor.left || u.cursor.left < 0) {
            setTooltipState(t => t.show ? { ...t, show: false } : t);
            return;
        }

        const { idx } = u.cursor;
        const { left, top } = u.cursor;

        // Check if cursor has a data index
        if (idx === null) {
            setTooltipState(t => t.show ? { ...t, show: false } : t);
            return;
        }

        const timestamp = u.data[0]?.[idx?idx:0];

        // Check if data at index is valid
        if (timestamp === undefined) {
            setTooltipState(t => t.show ? { ...t, show: false } : t);
            return;
        }

        const date = new Date(timestamp * 1000);
        const formattedDate = new Intl.DateTimeFormat(navigator.language, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).format(date);

        let content = `<div style="text-align: center;">${formattedDate}</div>`;
        let seriesInfoAdded = false;

        // Add a row for each series to the tooltip
        seriesData?.forEach((series, i) => {
            const value = u.data[i + 1]?.[idx?idx:0];
            // Only show series in tooltip if it's currently visible (toggled on)
            if (value !== null && value !== undefined && u.series[i + 1].show) {
                seriesInfoAdded = true;

                // Default to the unique series name, which is stored in the '__name__' label.
                let tooltipLabel = series.labels.__name__ || 'unknown_series';
                let resolution = 2; // Default resolution
                let units = ''; // Default units

                // Try to find a user-defined alias (series_rename)
                if (query && Array.isArray(query) && query.length > 0 && typeof query[0] !== 'string') {
                    const queryObj = (query as (StoreQueryObject | QueryObjectWithVisibility)[])
                        .find(q => q.id === series.queryId);

                    if (queryObj && 'series' in queryObj && Array.isArray(queryObj.series)) {
                        const seriesObj = queryObj.series.find(s => 
                            s.series_name === series.labels.__name__ || s.series_name === ''
                        );
                        if (seriesObj && seriesObj.series_rename) {
                            tooltipLabel = seriesObj.series_rename;
                        }
                    }
                    // Get units and resolution from query level
                    if (queryObj && 'units' in queryObj && 'resolution' in queryObj) {
                        resolution = queryObj.resolution;
                        units = queryObj.units ?? '';
                    }
                }
                // Use the same color palette rotation as the series lines
                const color = colorPalette[i % colorPalette.length];
                content += `<div>
                    <span style="color: ${color};">■</span> ${tooltipLabel}: ${formatScientific(value, resolution)} ${units}
                </div>`;
            }
        });

        // If no visible series have data at this point, hide the tooltip.
        if (!seriesInfoAdded) {
            setTooltipState(t => t.show ? { ...t, show: false } : t);
            return;
        }

        const plotLeft = u.bbox.left / uPlot.pxRatio;
        const plotTop = u.bbox.top / uPlot.pxRatio;
        const containerPadding = 16; // from p-4

        const finalLeft = plotLeft + left + containerPadding;
        const finalTop = plotTop + (top?top:0) + containerPadding;

        setTooltipState({
            show: true,
            left: finalLeft,
            top: finalTop,
            content,
        });
    }, [seriesData, query]); // Depends on seriesData and query to access labels and aliases

    const chartOptions: Options = useMemo(() => ({
        width: size.width,
        height: size.height,
        // title,
         padding: [15, 15, 5, 15],
        select: {
            show: true,
            // The uPlot types are strict and require these properties,
            // even though they are internally managed by the library.
            // We provide dummy values to satisfy the compiler.
            left: 0,
            top: 0,
            width: 0,
            height: 0,
        },
        legend:{
            show: true,
            live: false, // We use a custom tooltip, so the legend can be static
            isolate: true, // Click to isolate a series, ctrl+click to toggle
            mount: (self, el) => {
                if (!legendContainerRef.current) return;
                legendContainerRef.current.innerHTML = '';
                // The default uPlot legend is a flex container. To make it scroll
                // horizontally, we just need to prevent it from wrapping.
                el.style.flexWrap = 'nowrap';
                legendContainerRef.current.appendChild(el);
            }
        },
        cursor: {
            drag: { x: true, y: true },
            points: {
                show: false, // Use custom tooltip, so disable default points
                size: 6,
                stroke: '#ffffff', // Match panel background
                fill: '#73bf69',   // Match line color
            },
        },
        series: [ // The first series is always the X-axis (time)
            {
                show: false, // This will hide the time value from the legend
            },
            // Dynamically create a series configuration for each data series
            ...(seriesData?.map((s, i) => {
                const color = colorPalette[i % colorPalette.length];

                // Default to the unique series name, which is stored in the '__name__' label.
                let legendLabel = s.labels.__name__ || 'unknown_series';
                let resolution = 2; // Default resolution
                let units = ''; // Default units

                // Try to find a user-defined alias (series_rename)
                if (query && Array.isArray(query) && query.length > 0 && typeof query[0] !== 'string') {
                    // Find the query object from the prop that matches the series's stable queryId
                    const queryObj = (query as (StoreQueryObject | QueryObjectWithVisibility)[])
                        .find(q => q.id === s.queryId);

                    if (queryObj && 'series' in queryObj && Array.isArray(queryObj.series)) {
                        const seriesObj = queryObj.series.find(series => 
                            series.series_name === s.labels.__name__ || series.series_name === ''
                        );
                        // If a custom rename exists and isn't an empty string, use it.
                        if (seriesObj && seriesObj.series_rename) {
                            legendLabel = seriesObj.series_rename;
                        }
                    }
                    // Get units and resolution from query level
                    if (queryObj && 'units' in queryObj && 'resolution' in queryObj) {
                        resolution = queryObj.resolution;
                        units = queryObj.units ?? '';
                    }
                }

                return {
                    label: legendLabel,
                    stroke: color,
                    width: 2,
                    fill: hexToRgba(color, 0),
                    points: { show: false },
                    value: (_: uPlot, rawValue: number) => `${formatScientific(rawValue, resolution)} ${units}`,
                };
            }) || [{
                    label: 'Value', // Default for when there's no data yet
                    stroke: '#73bf69',
            }]),
        ], 
        axes: [
            { // X-Axis (Time)
                label: 'Time', 
                stroke: '#000',
                font: '12px Arial',
                border: { show: true, stroke: '#000', width: 2 },
                grid: { show: true, stroke: "rgba(0, 0, 0, 0.1)" },
                ticks: { show: true, stroke: '#000', width: 2 }

            },
            { // Y-Axis (Value)
                stroke: '#000',
                font: '12px Arial',
                border: { show: true, stroke: '#000', width: 2 },
                grid: { show: true, stroke: "rgba(0, 0, 0, 0.1)" },
                ticks: { show: true, stroke: '#000', width: 2 },

                values: (u, vals) => vals.map(v => {
                    // Find the first visible series to use its formatting for the axis
                    const firstVisibleSeriesIndex = u.series.findIndex((s, i) => i > 0 && s.show);

                    if (firstVisibleSeriesIndex > 0 && seriesData && seriesData[firstVisibleSeriesIndex - 1]) {
                        const series = seriesData[firstVisibleSeriesIndex - 1];
                        const queryObj = (query as StoreQueryObject[]).find(q => q.id === series.queryId);

                        const resolution = queryObj?.resolution ?? 2;

                        return `${formatScientific(v, resolution)}`;
                    }

                    // Fallback if no series is visible or data is not ready
                    return formatScientific(v, 2);
                }),
            },
        ],
        hooks: {
            setCursor: [handleSetCursor],
            setScale: [
                (u) => {
                    // Track initial x-axis range on first render
                    if (initialXRange.current === null && u.scales.x) {
                        initialXRange.current = { min: u.scales.x.min || 0, max: u.scales.x.max || 0 };
                    }
                    // Check if current range differs from initial range
                    if (initialXRange.current && u.scales.x) {
                        const isCurrentlyZoomed = 
                            u.scales.x.min !== initialXRange.current.min || 
                            u.scales.x.max !== initialXRange.current.max;
                        setIsZoomed(isCurrentlyZoomed);
                    }
                }
            ],
        }
    }), [size.width, size.height, handleSetCursor, seriesData, query]);

    // Custom styles to make the zoom selection box more visible on a dark theme.
    const customUplotStyles = `
        .u-select {
            background: rgba(0, 0, 0, 0.1) !important;
            border: 1px dashed #000;
        }
        .u-legend .u-series > * {
            padding: 4px 8px;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        .u-legend .u-series:hover > * {
            background-color: rgba(0,0,0,0.05);
        }
        .u-legend .u-series th {
            color: #000;
            font-weight: 500;
            padding-left: 8px;
        }
        .u-legend .u-series td {
            font-weight: 400;
        }
        .u-legend .u-series.u-off > * {
            opacity: 0.4;
            background-color: transparent;
        }
    `;

    return (
        <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-md border border-gray-200">
            <div 
                ref={containerRef} 
                className="flex-grow p-3 relative min-h-0"
                // The padding is applied here, so the chart width/height calculation is correct.
                // uPlot's width/height is based on the contentRect of this container.
            >
                <style>{customUplotStyles}</style>
                {tooltipState.show && (
                <div
                    style={{
                        position: 'absolute',
                        left: tooltipState.left,
                        top: tooltipState.top - 10,
                        transform: 'translateX(-50%) translateY(-100%)',
                        pointerEvents: 'none',
                        zIndex: 100,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        color: 'white',
                        fontSize: '11px',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        border: 'none',
                    }}
                    dangerouslySetInnerHTML={{ __html: tooltipState.content }}
                />
                )}
                {/* {loading && <p className="text-gray-700 text-center">Loading...</p>} */}
                {error && <p className="text-red-500 text-center">{error}</p>}
                {alignedData && size.width > 0 && (
                <>
                    <IconButton
                        aria-label="Reset Zoom"
                        onClick={handleResetZoom}
                        disabled={!isZoomed}
                        sx={{
                            position: 'absolute',
                            top: '12px', // Adjusted for new padding
                            right: '12px', // Adjusted for new padding
                            zIndex: 10,
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                            color: '#000',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            },
                            '&.Mui-disabled': {
                                opacity: 0.3,
                                color: '#000',
                            },
                        }}
                    >
                        <ZoomOutMapIcon />
                    </IconButton>
                    <UplotReact
                        options={chartOptions}
                        data={alignedData}
                        onCreate={(chart) => { chartRef.current = chart; }}
                        onDelete={() => { chartRef.current = null; }}
                    />
                </>
                )}
            </div>
            <Box
                ref={legendContainerRef}
                className="flex-shrink-0 max-h-16 overflow-x-auto overflow-y-hidden whitespace-nowrap p-2 border-t border-gray-200 bg-gray-50"
                sx={{
                    // Webkit (Chrome, Safari, Edge)
                    '&::-webkit-scrollbar': {
                        height: '8px', // for horizontal scrollbar
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#D1D5DB', // A mid-gray for the thumb
                        borderRadius: '4px',
                        '&:hover': {
                            backgroundColor: '#9CA3AF', // Lighter gray on hover
                        },
                    },
                    // Firefox
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#D1D5DB transparent', // thumb color and track color
                }}
            >
                {/* uPlot legend will be mounted here */}
            </Box>
        </div>
    );
};


export default ChartPanel;