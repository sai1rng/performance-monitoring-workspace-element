import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Define the structure for a single panel
import { v4 as uuidv4 } from 'uuid';
export interface SeriesObject {
  series_name: string;
  series_rename: string;
}

export interface QueryObject {
  query: string;
  id: string; // Add a unique ID for each query
  series: SeriesObject[];
  units: string;
  resolution: number;
}

export interface PanelConfig {
  id: string;
  title: string;
  queries: QueryObject[];
  description?: string;
  operatingSystem?: string; // Track which OS this panel was created for
  compoundProductId?: string; // Track which compound product this panel belongs to
  instanceId?: string; // Track which instance this panel belongs to
}

interface DashboardState {
  panels: PanelConfig[];
  instanceDetails: {
    [compoundProductId: string]: {
      [provisionedCompoundProductId: string]: {
        [instanceId: string]: {
          details: any;
        }
      }
    }
  };
}

// Initial state with some example panels
const initialState: DashboardState = {
  panels: [
    {
      id: 'Prometheus-Query-Rate',
      title: 'Prometheus Query Rate',
      operatingSystem: 'observability-node',
      queries: [
        { id: uuidv4(), query: 'rate(prometheus_http_requests_total[5m])', series: [], units: 'req/s', resolution: 2 },
      ],
    },
    {
      id: 'Scrape-Duration',
      title: 'Scrape Duration',
      operatingSystem: 'observability-node',
      queries: [{ id: uuidv4(), query: 'prometheus_target_interval_length_seconds', series: [], units: 's', resolution: 2 }],
    },
  ],
  instanceDetails: {},
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDashboardState: (state, action: PayloadAction<DashboardState>) => {
      // Replace the entire dashboard state with the payload
      state.panels = action.payload.panels;
      if (action.payload.instanceDetails) {
        state.instanceDetails = action.payload.instanceDetails;
      }
    },
    addPanel: (state, action: PayloadAction<PanelConfig | undefined>) => {
      if (action.payload) {
        // Add the provided panel configuration
        state.panels.push(action.payload);
      } else {
        // Create a default empty panel
        const newPanelId = uuidv4();
        state.panels.push({
          id: newPanelId,
          title: 'New Panel',
          queries: [{ id: uuidv4(), query: '', series: [], units: '', resolution: 2 }],
        });
      }
    },
    updatePanelFromFile: (state, action: PayloadAction<{ panelId: string; panelConfig: Omit<PanelConfig, 'id'> }>) => {
      const { panelId, panelConfig } = action.payload;
      const panel = state.panels.find(p => p.id === panelId);
      if (panel) {
        panel.title = panelConfig.title;
        // Assign new IDs to queries to prevent potential ID conflicts
        panel.queries = panelConfig.queries.map(q => ({
          ...q,
          id: uuidv4(),
        }));
      }
    },
    addQuery: (state, action: PayloadAction<{ panelId: string }>) => {
      const panel = state.panels.find(p => p.id === action.payload.panelId);
      if (panel) {
        panel.queries.push({ id: uuidv4(), query: '', series: [], units: '', resolution: 2 }); // Generate unique ID
      }
    },
    updateQuery: (state, action: PayloadAction<{ panelId: string; queryId: string; query: string }>) => {
      const panel = state.panels.find(p => p.id === action.payload.panelId);
      if (panel) {
        const queryObj = panel.queries.find(q => q.id === action.payload.queryId);
        if (queryObj) {
          queryObj.query = action.payload.query;
        }
      }
    },
    removeQuery: (state, action: PayloadAction<{ panelId: string; queryId: string }>) => {
      const panel = state.panels.find(p => p.id === action.payload.panelId);
      if (panel) {
        panel.queries = panel.queries.filter(q => q.id !== action.payload.queryId);
      }
    },
    deletePanel: (state, action: PayloadAction<{ panelId: string }>) => {
      state.panels = state.panels.filter(p => p.id !== action.payload.panelId);
    },
    setSeriesForQuery: (state, action: PayloadAction<{ panelId: string; queryId: string; seriesNames: string[] }>) => {
      const panel = state.panels.find(p => p.id === action.payload.panelId);
      if (panel) {
        const queryObj = panel.queries.find(q => q.id === action.payload.queryId);
        if (queryObj) {
          const existingSeries = queryObj.series;
          const newSeriesNames = action.payload.seriesNames;

          // Ensure newSeriesNames are unique to prevent duplicate entries
          const uniqueNewSeriesNames = Array.from(new Set(newSeriesNames));

          const newSeries = uniqueNewSeriesNames.map(name => {
            const existing = existingSeries.find(s => s.series_name === name);
            return existing || { series_name: name, series_rename: name };
          });

          // Prevent infinite loops by checking if the series data has actually changed.
          const isUnchanged = existingSeries.length === newSeries.length &&
            existingSeries.every((s, i) =>
              s.series_name === newSeries[i].series_name && s.series_rename === newSeries[i].series_rename
            );

          if (!isUnchanged) {
            queryObj.series = newSeries;
          }
        }
      }
    },
    updateSeriesRename: (state, action: PayloadAction<{ panelId: string; queryId: string; seriesName: string; newRename: string }>) => {
      const { panelId, queryId, seriesName, newRename } = action.payload;
      const panel = state.panels.find(p => p.id === panelId);
      if (panel) {
        const queryObj = panel.queries.find(q => q.id === queryId);
        if (queryObj) {
          const series = queryObj.series.find(s => s.series_name === seriesName);
          if (series) {
            series.series_rename = newRename;
          }
        }
      }
    },
    updateQueryUnits: (state, action: PayloadAction<{ panelId: string; queryId: string; units: string }>) => {
      const { panelId, queryId, units } = action.payload;
      const panel = state.panels.find(p => p.id === panelId);
      if (panel) {
        const queryObj = panel.queries.find(q => q.id === queryId);
        if (queryObj) {
          queryObj.units = units;
        }
      }
    },
    updateQueryResolution: (state, action: PayloadAction<{ panelId: string; queryId: string; resolution: number }>) => {
      const { panelId, queryId, resolution } = action.payload;
      const panel = state.panels.find(p => p.id === panelId);
      if (panel) {
        const queryObj = panel.queries.find(q => q.id === queryId);
        if (queryObj) {
          queryObj.resolution = resolution;
        }
      }
    },
    updatePanelTitle: (state, action: PayloadAction<{ panelId: string; title: string }>) => {
      const { panelId, title } = action.payload;
      const panel = state.panels.find(p => p.id === panelId);
      if (panel) {
        panel.title = title;
      }
    },
    setInstanceDetails: (state, action: PayloadAction<{ compoundProductId: string; provisionedCompoundProductId: string; instanceId: string; details: any }>) => {
      const { compoundProductId, provisionedCompoundProductId, instanceId, details } = action.payload;
      if (!state.instanceDetails[compoundProductId]) {
        state.instanceDetails[compoundProductId] = {};
      }
      if (!state.instanceDetails[compoundProductId][provisionedCompoundProductId]) {
        state.instanceDetails[compoundProductId][provisionedCompoundProductId] = {};
      }
      state.instanceDetails[compoundProductId][provisionedCompoundProductId][instanceId] = { details };
    },
  },
});

export const { setDashboardState, addPanel, updatePanelFromFile, addQuery, updateQuery, removeQuery, deletePanel, setSeriesForQuery, updateSeriesRename, updateQueryUnits, updateQueryResolution, updatePanelTitle, setInstanceDetails } =
  dashboardSlice.actions;

// Selector to get a panel by its ID
export const selectPanelById = (state: { dashboard: DashboardState }, panelId: string) =>
  state.dashboard.panels.find((p: PanelConfig) => p.id === panelId);

export default dashboardSlice.reducer;
