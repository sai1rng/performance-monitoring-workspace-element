import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button, TextField, Box, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel , Tooltip, Tabs, Tab, Checkbox, FormControlLabel} from '@mui/material';
import AddIcon from '@mui/icons-material/Add'; // PlusIcon
import RemoveIcon from '@mui/icons-material/Remove'; // MinusIcon
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ChartPanel from '../components/performance-analysis/ChartPanel';
import { type PrometheusSeries } from '../hooks/usePrometheusRangeQuery';
import { type RootState } from '../store';
import {
  addQuery,
  updateQuery,
  removeQuery,
  setSeriesForQuery,
  updateSeriesRename,
  updatePanelTitle,
  deletePanel,
  updatePanelFromFile,
  updateQueryUnits,
  updateQueryResolution,
  type QueryObject,
  type SeriesObject,
} from '../store/dashboardSlice';
import { Header } from '../components/layout';
import SidePanel from '../components/layout/SidePanel';
import styled from 'styled-components';
import FaultInjectionPanel from '../components/fault-injection/FaultInjectionPanel';
import ServiceManagementPanel from '../components/management/ServiceManagementPanel';

// Add blinking animation
const blinkingButtonStyle = {
  '@keyframes blink': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.5 },
    '100%': { opacity: 1 },
  },
  animation: 'blink 2s ease-in-out infinite',
};


interface LocalQueryState {
  id: string;
  query: string;
}

const LeftSidebar = styled.div`
  width: 300px;
  flex-shrink: 0;
  background-color: #ffffff;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid #e1e5e9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  height: calc(100vh - 80px);
  overflow-y: auto;
`;

const EditPanelPage = () => {
  // --- 1. ALL HOOKS CALLED AT THE TOP ---
  const { panelId } = useParams<{ panelId: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  
      const { workspaceId, compoundProductId, provisionedCompoundProductId, productId } = useParams<{
        workspaceId: string;
        compoundProductId: string;
        provisionedCompoundProductId: string;
        productId: string;
      }>();

  // Use useSelector to get the specific panel from the Redux store
  // Safely handle potentially undefined panelId
  const panel = useSelector((state: RootState) =>
    panelId ? state.dashboard.panels.find((p) => p.id === panelId) : undefined
  );

  // Get instance details from dashboardSlice to determine OS
  const instanceDetails = useSelector((state: RootState) => state.dashboard.instanceDetails);
  
  // Get OS from instance details using the route parameters
  const getOSFromInstanceDetails = () => {
    if (compoundProductId && provisionedCompoundProductId && productId && productId !== 'observability-node') {
      const details = instanceDetails?.[compoundProductId]?.[provisionedCompoundProductId]?.[productId]?.details;
      if (details?.os) {
        return details.os.toLowerCase() as 'linux' | 'windows';
      }
    }
    // Fallback: try to determine from productId if it contains instance ID patterns
    if (productId?.includes('i-01b41705934fbddbd')) return 'linux';
    if (productId?.includes('i-0d7223d32eab3b6e9')) return 'windows';
    // Default fallback
    return 'linux';
  };

  const osType = getOSFromInstanceDetails();

  // Local state to manage query visibility for the preview
  const [queryVisibility, setQueryVisibility] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>(`/${workspaceId}/${compoundProductId}/${provisionedCompoundProductId}/${productId}/performance-monitoring-dashboard`);
  // Local state for editing queries to avoid dispatching on every keystroke
  const [localQueries, setLocalQueries] = useState<LocalQueryState[]>([]);

  // Local state to track which queries have unsaved changes
  const [dirtyQueries, setDirtyQueries] = useState<Record<string, boolean>>({});

  // Local state to track which query is selected for settings by its stable ID
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);

  // Local state for editing the panel title
  const [localTitle, setLocalTitle] = useState('');

  // State to hold the series data from the chart panel for use in the settings
  const [seriesData, setSeriesData] = useState<PrometheusSeries[] | null>(null);

  // State and ref to handle focusing the new query input
  const [shouldFocusNewQuery, setShouldFocusNewQuery] = useState(false);
  const queriesContainerRef = useRef<HTMLDivElement>(null);

  // State to toggle display between original series name and its alias
  const [previewOriginal, setPreviewOriginal] = useState<Record<string, boolean>>({});

  // Local state for editing series rename settings to avoid dispatching on every keystroke
  const [localSeriesRenames, setLocalSeriesRenames] = useState<Record<string, string>>({});

  // Local state for editing query-level settings
  const [localQueryUnits, setLocalQueryUnits] = useState<string>('');
  const [localQueryResolution, setLocalQueryResolution] = useState<number>(0);

  // State for the delete confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for upload progress
  const [isUploading, setIsUploading] = useState(false);

  // State for notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // State for live refresh
  const [isLive, setIsLive] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000); // Default 5 seconds
  const [refreshKey, setRefreshKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30); // Default 30 minutes

  // State for tabs
  const [activeBottomTab, setActiveBottomTab] = useState(0);
  const [faultLogs, setFaultLogs] = useState<Array<{id: string, timestamp: string, message: string}>>([]);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());

  // --- ALL useEffect & useMemo HOOKS ---

  // CORRECTED: Use functional updates for `setQueryVisibility` and `setDirtyQueries`
  // to avoid stale state and incorrect dependencies.
  useEffect(() => {
    if (panel) {
      setLocalQueries(panel.queries.map(q => ({ id: q.id, query: q.query })));
      setLocalTitle(panel.title);

      // Use functional updates
      setQueryVisibility(prevVisibility => {
        const newVisibility: Record<string, boolean> = {};
        panel.queries.forEach(q => {
          newVisibility[q.id] = prevVisibility[q.id] ?? true;
        });
        return newVisibility;
      });
    
      setDirtyQueries(prevDirty => {
        const newDirty: Record<string, boolean> = {};
        panel.queries.forEach(q => {
          newDirty[q.id] = prevDirty[q.id] ?? false;
        });
        return newDirty;
      });
    }
  }, [panel]);

  useEffect(() => {
    if (shouldFocusNewQuery && queriesContainerRef.current) {
      const inputs = queriesContainerRef.current.querySelectorAll('input');
      const lastInput = inputs[inputs.length - 1];
      if (lastInput) {
        lastInput.focus();
      }
      setShouldFocusNewQuery(false);
    }
  }, [shouldFocusNewQuery, panel?.queries]);

  const selectedQueryObject = useMemo(() => {
    if (selectedQueryId === null || !panel) return null;
    return panel.queries.find(q => q.id === selectedQueryId);
  }, [selectedQueryId, panel]);

  useEffect(() => {
    setPreviewOriginal({});
  }, [selectedQueryId]);

  useEffect(() => {
    if (selectedQueryObject) {
      const newRenames: Record<string, string> = {};
      selectedQueryObject.series.forEach(s => {
        newRenames[s.series_name] = s.series_rename;
      });
      setLocalSeriesRenames(newRenames);
      setLocalQueryUnits(selectedQueryObject.units);
      setLocalQueryResolution(selectedQueryObject.resolution);
    } else {
      setLocalSeriesRenames({});
      setLocalQueryUnits('');
      setLocalQueryResolution(0);
    }
  }, [selectedQueryObject]);

  // Effect to handle live refresh
  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(() => {
        setRefreshKey(prev => prev + 1);
      }, refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLive, refreshInterval]);

  // Function to add logs to fault logs tab
  const addFaultLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setFaultLogs(prev => [...prev, { id, timestamp, message }]);
  };

  // CORRECTED: Added check to prevent infinite loop
  useEffect(() => {
    if (!seriesData || !panelId || !panel) return;

    const seriesByQueryId = seriesData.reduce((acc, series) => {
      const queryId = series.queryId;
      if (!acc[queryId]) {
        acc[queryId] = [];
      }
      acc[queryId].push(series.labels.__name__);
      return acc;
    }, {} as Record<string, string[]>);

    Object.entries(seriesByQueryId).forEach(([queryId, newSeriesNames]) => {
      // Find the current query in the panel state
      const currentQuery = panel.queries.find(q => q.id === queryId);
      const currentSeriesNames = currentQuery ? currentQuery.series.map(s => s.series_name) : [];

      // Check if the new series are different from the old series
      const hasChanged = 
        newSeriesNames.length !== currentSeriesNames.length || 
        !newSeriesNames.every(name => currentSeriesNames.includes(name));

      // Only dispatch if they have actually changed
      if (hasChanged) {
        dispatch(setSeriesForQuery({
          panelId,
          queryId,
          seriesNames: newSeriesNames,
        }));
      }
    });
  }, [seriesData, panelId, dispatch, panel]);

  const queriesWithVisibility = useMemo(() => {
    // Panel might be undefined on first render, so check for it
    if (!panel) return [];
    return panel.queries.map(q => ({
      ...q,
      visible: queryVisibility[q.id] ?? true,
    }));
  }, [panel, queryVisibility]);


  // --- 2. CONDITIONAL RETURNS *AFTER* ALL HOOKS ---
  if (!panelId) return <div>Invalid Panel ID</div>;
  if (!panel) return <div>Panel not found</div>;


  // --- 3. EVENT HANDLERS & RENDER LOGIC ---

  const handleToggleVisibility = (queryId: string) => {
    setQueryVisibility(vis => ({ ...vis, [queryId]: !vis[queryId] }));
  };

  const handleSelectQueryForSettings = (queryId: string) => {
    setSelectedQueryId(prevId => (prevId === queryId ? null : queryId));
  };

  const handleAddQuery = () => {
    dispatch(addQuery({ panelId }));
    setShouldFocusNewQuery(true);
  };

  const handleRemoveQuery = (queryId: string) => {
    dispatch(removeQuery({ panelId, queryId }));
    if (selectedQueryId === queryId) {
      setSelectedQueryId(null);
    }
  };

  const handleQueryChange = (queryId: string, value: string) => {
    setLocalQueries(lq => lq.map(q => (q.id === queryId ? { ...q, query: value } : q)));
    setDirtyQueries(dq => ({ ...dq, [queryId]: true }));
  };

  const handleSaveQuery = (queryId: string) => {
    const queryToSave = localQueries.find(q => q.id === queryId);
    if (queryToSave) {
      dispatch(updateQuery({ panelId, queryId, query: queryToSave.query }));
      setDirtyQueries(dq => ({ ...dq, [queryId]: false }));
    }
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(event.target.value);
  };

  const handleTitleBlur = () => {
    if (panel && panel.title !== localTitle) {
      dispatch(updatePanelTitle({ panelId, title: localTitle }));
    }
  };

  const handleDeletePanel = () => {
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
  };

  const handleConfirmDelete = () => {
    const panelTitle = panel?.title || 'Untitled Panel';
    dispatch(deletePanel({ panelId }));
    navigate(`/${workspaceId}/${compoundProductId}/${provisionedCompoundProductId}/${productId}/performance-monitoring-dashboard`, { state: { message: `Panel "${panelTitle}" was deleted.` } });
  };

  const handleCloseNotification = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };


  const handleLocalSeriesRenameChange = (seriesName: string, newRename: string) => {
    setLocalSeriesRenames(prev => ({
      ...prev,
      [seriesName]: newRename,
    }));
  };

  const handleSeriesRenameBlur = (queryId: string, seriesName: string) => {
    if (!panelId) return;
    const localRename = localSeriesRenames[seriesName];
    const originalSeries = selectedQueryObject?.series.find(s => s.series_name === seriesName);

    if (localRename !== undefined && originalSeries && localRename !== originalSeries.series_rename) {
      dispatch(updateSeriesRename({ panelId, queryId, seriesName, newRename: localRename }));
    }
  };

  const handleQuerySettingsUpdate = (queryId: string) => {
    if (!panelId || !selectedQueryObject) return;

    if (localQueryUnits !== selectedQueryObject.units) {
      dispatch(updateQueryUnits({ panelId, queryId, units: localQueryUnits }));
    }
    if (localQueryResolution !== selectedQueryObject.resolution) {
      dispatch(updateQueryResolution({ panelId, queryId, resolution: localQueryResolution }));
    }
  };

  const handleSaveToFile = () => {
    if (!panel) return;
    const { id, ...panelConfigToSave } = panel;
    const stateToSave = JSON.stringify(panelConfigToSave, null, 2);
    const blob = new Blob([stateToSave], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${panel.title.replace(/\s+/g, '_') || 'panel'}-config.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    if (!seriesData || seriesData.length === 0) {
      setNotification({
        open: true,
        message: 'No data available to download.',
        severity: 'info',
      });
      return;
    }

    const aliasMap = new Map<string, string>();
    panel?.queries.forEach(q => {
      q.series.forEach(s => {
        if (s.series_rename) {
          aliasMap.set(s.series_name, s.series_rename);
        }
      });
    });

    const dataByTimestamp: Map<number, Record<string, string>> = new Map();
    const seriesNames = new Set<string>();

    seriesData.forEach(series => {
      const originalName = series.labels.__name__;
      const displayName = aliasMap.get(originalName) || originalName;
      seriesNames.add(displayName);

      series.timestamps.forEach((timestamp, index) => {
        const value = series.values[index];
        if (!dataByTimestamp.has(timestamp)) {
          dataByTimestamp.set(timestamp, {});
        }
        dataByTimestamp.get(timestamp)![displayName] = value !== null ? String(value) : '';
      });
    });

    const sortedTimestamps = Array.from(dataByTimestamp.keys()).sort((a, b) => a - b);
    const sortedSeriesNames = Array.from(seriesNames).sort();

    const header = ['Time', ...sortedSeriesNames].join(',');

    const csvRows = [header];
    sortedTimestamps.forEach(timestamp => {
      const date = new Date(timestamp * 1000).toISOString();
      const rowData = dataByTimestamp.get(timestamp)!;
      const row = [date, ...sortedSeriesNames.map(name => rowData[name] ?? '')].join(',');
      csvRows.push(row);
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${localTitle.replace(/\s+/g, '_') || 'chart-data'}.csv`);
    link.click();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('File content is not a string.');
        const panelConfig = JSON.parse(text);

        if (typeof panelConfig.title !== 'string' || !Array.isArray(panelConfig.queries)) {
          throw new Error("Invalid panel configuration file. Missing 'title' or 'queries'.");
        }

        dispatch(updatePanelFromFile({ panelId, panelConfig }));
        setNotification({
          open: true,
          message: `Panel configuration updated from file.`,
          severity: 'success',
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setNotification({
          open: true,
          message: `Failed to load panel configuration: ${errorMessage}`,
          severity: 'error',
        });
      } finally {
        if (event.target) event.target.value = '';
        setTimeout(() => {
          setIsUploading(false);
        }, 2000);
      }
    };
    reader.readAsText(file);
  };

  const handleToggleLive = () => {
    setIsLive(prev => !prev);
  };

  const handleRefreshIntervalChange = (event: any) => {
    setRefreshInterval(event.target.value);
  };

  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value);
  };

  const handleManualRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveBottomTab(newValue);
  };

  const clearFaultLogs = () => {
    setFaultLogs([]);
    setSelectedLogs(new Set());
  };

  const handleLogSelection = (logId: string, checked: boolean) => {
    setSelectedLogs(prev => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(logId);
      } else {
        newSelected.delete(logId);
      }
      return newSelected;
    });
  };

  const handleSelectAllLogs = (checked: boolean) => {
    if (checked) {
      setSelectedLogs(new Set(faultLogs.map(log => log.id)));
    } else {
      setSelectedLogs(new Set());
    }
  };

  // --- 4. JSX RETURN ---
  return (
    <>
    <Header activeTab={activeTab} setActiveTab={setActiveTab} backto='Performance Dashboard' />
    <div className="flex h-[calc(100vh-80px)]">
      <SidePanel os={osType} instanceId={productId} onFaultLog={addFaultLog} />
      <div className="flex flex-col flex-grow text-white min-w-0">
      <Snackbar
        open={notification.open}
        autoHideDuration={2000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>

      <div className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
        <div className="text-xl font-bold text-black">Edit Panel</div>
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept="application/json"
          />
          <Button
            onClick={handleUploadClick}
            variant="outlined"
            startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <FileUploadIcon />}
            disabled={isUploading}
          >
            {isUploading ? 'Loading...' : 'Load Panel'}
          </Button>
          <Button onClick={handleSaveToFile} variant="outlined" startIcon={<SaveAltIcon />}>
            Save Panel
          </Button>
          <Button onClick={handleDeletePanel} variant="outlined" color="error" startIcon={<DeleteIcon />}>
            Delete Panel
          </Button>

        </div>
      </div>

      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          style: {
            backgroundColor: '#2d2f34',
            color: 'white',
          },
        }}
      >
        <DialogTitle id="alert-dialog-title">
          {`Delete Panel "${panel?.title}"?`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Are you sure you want to permanently delete this panel? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} sx={{ color: 'white' }}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <div className="flex-grow min-h-[500px] p-4">
        <div className="w-full h-full bg-white rounded-lg overflow-hidden flex flex-col shadow-md border border-gray-200">
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2, gap: 2 }}>
            <TextField
              fullWidth
              variant="standard"
              value={localTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              placeholder="Panel Title"
              sx={{
                '& .MuiInput-underline:before': { borderBottomColor: 'transparent' },
                '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: 'rgba(255,255,255,0.3)' },
               '& .MuiInput-underline:after': { borderBottomColor: 'primary.main' },
                '& .MuiInputBase-input': {
                  color: 'black',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                },
              }}
            />
            <Button
              onClick={handleToggleLive}
              variant={isLive ? 'contained' : 'outlined'}
              startIcon={isLive ? <PauseIcon /> : <PlayArrowIcon />}
              color={isLive ? 'success' : 'primary'}
              sx={{
                minWidth: '100px',
                whiteSpace: 'nowrap',
                ...(isLive ? blinkingButtonStyle : {}),
              }}
            >
              {isLive ? 'Live' : 'Paused'}
            </Button>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="refresh-interval-label">Refresh Rate</InputLabel>
              <Select
                labelId="refresh-interval-label"
                value={refreshInterval}
                onChange={handleRefreshIntervalChange}
                label="Refresh Rate"
                sx={{
                  backgroundColor: 'white',
                }}
              >
                <MenuItem value={1000}>1s</MenuItem>
                <MenuItem value={5000}>5s</MenuItem>
                <MenuItem value={10000}>10s</MenuItem>
                <MenuItem value={30000}>30s</MenuItem>
                <MenuItem value={60000}>1m</MenuItem>
                <MenuItem value={300000}>5m</MenuItem>
              </Select>
            </FormControl>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="time-range-label">Time Range</InputLabel>
              <Select
                labelId="time-range-label"
                value={timeRange}
                onChange={handleTimeRangeChange}
                label="Time Range"
                sx={{
                  backgroundColor: 'white',
                }}
              >
                <MenuItem value={15}>15 min</MenuItem>
                <MenuItem value={30}>30 min</MenuItem>
                <MenuItem value={60}>1 hour</MenuItem>
                <MenuItem value={180}>3 hours</MenuItem>
                <MenuItem value={360}>6 hours</MenuItem>
                <MenuItem value={720}>12 hours</MenuItem>
                <MenuItem value={1440}>24 hours</MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="Refresh Charts">
              <IconButton
                onClick={handleManualRefresh}
                size="small"
                aria-label="Refresh Charts"
                sx={{
                  minHeight: '40px',
                  minWidth: '40px',
                  borderRadius: 1,
                  border: '1px solid rgba(0, 0, 0, 0.23)',
                  color: 'rgba(0, 0, 0, 0.87)',
                  backgroundColor: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Download CSV">
            <IconButton
              onClick={handleDownloadCSV}
              size="small"
              aria-label='Download CSV'

              sx={{
                minHeight: '40px',
                whiteSpace: 'nowrap',
                borderRadius: 1,
                border: '1px solid rgba(0, 0, 0, 0.23)',
                borderColor: 'rgba(0, 0, 0, 0.23)',
                color: 'rgba(0, 0, 0, 0.87)',
                backgroundColor: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                },
              }}
            >
              <DownloadIcon />
            </IconButton>
            </Tooltip>

          </Box>
          <div className="flex-grow min-h-0">
            <ChartPanel 
              refreshTrigger={refreshKey} 
              timeRange={timeRange} 
              query={queriesWithVisibility} 
              title={localTitle} 
              instanceId={productId}
              instanceDetails={compoundProductId && provisionedCompoundProductId && productId ? instanceDetails?.[compoundProductId]?.[provisionedCompoundProductId]?.[productId]?.details : undefined}
              onDataFetched={setSeriesData} 
            /> //@TODO: Remove dummy data
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50" style={{ height: '28vh' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeBottomTab} onChange={handleTabChange} aria-label="Panel tabs">
            <Tab label="Queries" />
            <Tab label="Fault Logs" />
          </Tabs>
        </Box>
        
        {activeBottomTab === 0 && (
          <div className="flex flex-row h-full">
            <div
              className={`p-4 bg-gray-50 text-gray-800 flex flex-col transition-all duration-300 ease-in-out ${selectedQueryId !== null ? 'w-1/2' : 'w-full'}`}
            >
              <h3 className="text-lg font-semibold mb-4 flex-shrink-0">Queries</h3>
              <Box
                ref={queriesContainerRef}
                className="flex-grow overflow-y-auto pr-2"
                sx={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#D1D5DB',
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: '#9CA3AF',
                    },
                  },
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#D1D5DB transparent',
                }}
              >
            {panel.queries.map((query) => {
              const localQuery = localQueries.find(lq => lq.id === query.id);
              const isDirty = dirtyQueries[query.id] ?? false;
              const isVisible = queryVisibility[query.id] ?? true;

              return (
              <Box key={query.id} sx={{
                display: 'flex', 
                alignItems: 'center', 
                mb: 2, 
                p: 1, 
                borderRadius: 1,
                backgroundColor: selectedQueryId === query.id ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                border: selectedQueryId === query.id ? '1px solid rgba(9, 100, 235, 0.6)' : '1px solid #e5e7eb',
                transition: 'background-color 0.3s, border 0.3s',
              }}>
                <TextField
                variant="outlined"
                size="small"
                value={localQuery?.query ?? ''}
                onChange={(e) => handleQueryChange(query.id, e.target.value)}
                placeholder={`Query ${panel.queries.indexOf(query) + 1}`}
                sx={{
                  flexGrow: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFF',
                    '& fieldset': {
                      borderColor: '#D1D5DB',
                    },
                    '&:hover fieldset': {
                      borderColor: '#9CA3AF',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#111827',
                  },
                }}
                />
                <IconButton
                  onClick={() => handleSaveQuery(query.id)}
                  aria-label="Save query"
                  size="small"
                  disabled={!isDirty}
                  sx={{
                    ml: 1,
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    color: '#16A34A',
                    borderRadius: 1,
                    transition: 'background-color 0.3s',
                    '&:hover': {
                      backgroundColor: 'rgba(22, 163, 74, 0.2)',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      color: 'rgba(0, 0, 0, 0.26)',
                    },
                  }}
                >
                  <SaveIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => handleSelectQueryForSettings(query.id)}
                  aria-label="Query settings"
                  size="small"
                  sx={{
                    ml: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    color: '#4B5563',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    },
                    borderRadius: 1,
                  }}
                >
                  <DisplaySettingsIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => handleToggleVisibility(query.id)}
                  aria-label="Toggle query visibility"
                  size="small"
                  sx={{
                    ml: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    color: isVisible ? '#4B5563' : '#9CA3AF',
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    },
                    borderRadius: 1,
                  }}
                >
                  {isVisible ? (
                    <VisibilityIcon fontSize="small" />
                  ) : (
                    <VisibilityOffIcon fontSize="small" />
                  )}
                </IconButton>
                <IconButton
                  onClick={() => handleRemoveQuery(query.id)}
                  aria-label="Remove query"
                  size="small"
                  sx={{
                    ml: 1,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                    '&:hover': {
                     backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    },
                    borderRadius: 1,
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )})}
              </Box>
              <IconButton
              onClick={handleAddQuery}
              aria-label="Add query"
              sx={{
                mt: 2,
                width: '100%',
                border: '1px dashed',
                borderColor: 'grey.500',
                color: 'grey.600',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <AddIcon />
            </IconButton>
            </div>

            {selectedQueryId !== null && selectedQueryObject && (
              <Box
                className="w-1/2 pt-4 pl-4 pb-4 pr-3 bg-white overflow-y-auto"
                style={{ borderLeft: '1px solid #D1D5DB' }}
                sx={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#D1D5DB',
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: '#9CA3AF',
                    },
                  },
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#D1D5DB transparent',
                }}
              >
            <>
              <h3 className="text-lg font-semibold mb-4 text-black">Query Settings</h3>
              <p className="text-gray-400 mb-4">Editing query: {selectedQueryObject.query}</p>

              {/* Query-level settings */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, pr: '52px' }}>
                <TextField
                  label="Units"
                  value={localQueryUnits}
                  onChange={(e) => setLocalQueryUnits(e.target.value)}
                  onBlur={() => handleQuerySettingsUpdate(selectedQueryObject.id)}
                  variant="outlined"
                  size="small"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': { backgroundColor: '#FFFFFF', '& fieldset': { borderColor: '#D1D5DB' } },
                    '& .MuiInputBase-input': { color: '#111827' },
                    '& .MuiFormLabel-root': { color: '#6B7280' },
                  }}
                />
                <Box sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const newValue = Math.max(0, localQueryResolution - 1);
                      setLocalQueryResolution(newValue);
                    }}
                    onBlur={() => handleQuerySettingsUpdate(selectedQueryObject.id)}
                    sx={{ backgroundColor: '#FFFFFF', color: '#4B5563', borderRadius: 1, border: '1px solid #D1D5DB' }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <TextField
                    label="Resolution"
                    type="number"
                    value={localQueryResolution}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      readOnly: true,
                      inputProps: { min: 0, step: 1, max: 3, style: { textAlign: 'center' } },
                    }}
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': { backgroundColor: '#FFFFFF', '& fieldset': { borderColor: '#D1D5DB' } },
                      '& .MuiInputBase-input': { color: '#111827', cursor: 'default' },
                      '& .MuiFormLabel-root': { color: '#6B7280' },
                      'input::-webkit-outer-spin-button, input::-webkit-inner-spin-button': { display: 'none' },
                      'input[type=number]': { MozAppearance: 'textfield' },
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      const newValue = Math.min(3, localQueryResolution + 1);
                      setLocalQueryResolution(newValue);
                    }}
                    onBlur={() => handleQuerySettingsUpdate(selectedQueryObject.id)}
                    sx={{ backgroundColor: '#FFFFFF', color: '#4B5563', borderRadius: 1, border: '1px solid #D1D5DB' }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <h4 className="text-md font-semibold mb-2 text-gray-300">Series Aliases</h4>
              {selectedQueryObject.series.length > 0 ? (
                selectedQueryObject.series.map((series, seriesIndex) => (
                  <React.Fragment key={seriesIndex}>
                    {(() => {
                      const isPreviewing = previewOriginal[series.series_name] ?? false;
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <TextField
                            label="Alias"
                            value={isPreviewing ? series.series_name : localSeriesRenames[series.series_name] ?? ''}
                            onChange={(e) => handleLocalSeriesRenameChange(series.series_name, e.target.value)}
                            onBlur={() => handleSeriesRenameBlur(selectedQueryObject.id, series.series_name)}
                            helperText={`Original: ${series.series_name}`}
                            variant="outlined"
                            fullWidth
                            InputProps={{
                              readOnly: isPreviewing,
                            }}
                            sx={{
                              flexGrow: 1,
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: isPreviewing ? '#F3F4F6' : '#FFFFFF',
                                '& fieldset': { borderColor: '#D1D5DB' },
                                '&:hover fieldset': { borderColor: '#9CA3AF' },
                              },
                              '& .MuiInputBase-input': {
                                color: '#111827',
                                cursor: isPreviewing ? 'default' : 'text',
                              },
                              '& .MuiFormLabel-root': { color: '#6B7280' },
                              '& .MuiFormHelperText-root': { color: '#6B7280' },
                            }}
                          />
                          <IconButton
                            onClick={() => setPreviewOriginal(prev => ({ ...prev, [series.series_name]: !prev[series.series_name] }))}
                            disabled={series.series_name === (localSeriesRenames[series.series_name] ?? series.series_name)}
                            aria-label="Toggle between original and custom alias"
                            title="Toggle between original and custom alias"
                            sx={{
                              backgroundColor: isPreviewing ? 'primary.main' : 'rgba(0, 0, 0, 0.05)',
                              color: isPreviewing ? '#FFF' : '#4B5563',
                              borderRadius: 1,
                              '&:hover': {
                                backgroundColor: isPreviewing ? 'primary.dark' : 'rgba(0, 0,0, 0.1)',
                              },
                              '&.Mui-disabled': {
                                color: 'rgba(0, 0, 0, 0.26)',
                                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                              },
                            }}
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Box>
                      );
                    })()}
                  </React.Fragment>
                ))
              ) : (
                <p className="text-gray-500">No series returned for this query, or query has not been run. Ensure the query is saved and valid.</p>
             )}
            </>
          </Box>
        )}
      </div>
    )}
        
        {activeBottomTab === 1 && (
          <div className="p-4 bg-gray-50 text-gray-800 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">Fault Logs</h3>
                {faultLogs.length > 0 && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedLogs.size === faultLogs.length && faultLogs.length > 0}
                        indeterminate={selectedLogs.size > 0 && selectedLogs.size < faultLogs.length}
                        onChange={(e) => handleSelectAllLogs(e.target.checked)}
                      />
                    }
                    label={`Select All (${selectedLogs.size}/${faultLogs.length})`}
                  />
                )}
              </div>
              <Button onClick={clearFaultLogs} variant="outlined" size="small">
                Clear Logs
              </Button>
            </div>
            <Box
              className="flex-grow overflow-y-auto bg-white p-4 rounded"
              sx={{
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#D1D5DB',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: '#9CA3AF',
                  },
                },
                scrollbarWidth: 'thin',
                scrollbarColor: '#D1D5DB transparent',
              }}
            >
              {faultLogs.length === 0 ? (
                <div className="text-gray-600 text-center py-8 font-medium">No fault logs yet. Logs will appear here when fault injection operations are performed.</div>
              ) : (
                faultLogs.map((log) => (
                  <div key={log.id} className="mb-2 p-2 flex items-start gap-3">
                    <Checkbox
                      checked={selectedLogs.has(log.id)}
                      onChange={(e) => handleLogSelection(log.id, e.target.checked)}
                      value={JSON.stringify({ timestamp: log.timestamp, message: log.message })}
                      size="small"
                      sx={{ mt: -0.5 }}
                    />
                    <div className="flex-grow">
                      <div className="text-sm">
                        <span className="text-sm font-mono text-blue-600 mr-3 bg-blue-50 px-2 py-1 rounded">{log.timestamp}</span>
                        <span className="text-gray-800 font-medium leading-relaxed">{log.message}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Box>
          </div>
        )}
      </div>
    </div>
    </div>
    </>
  );
};

export default EditPanelPage;