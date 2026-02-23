import React, { useState, useEffect, useRef, useMemo } from 'react';
import './Dashboard.css';
import ChartPanel from '../components/performance-analysis/ChartPanel';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '../store';
import { addPanel, setDashboardState, setInstanceDetails, type PanelConfig, type QueryObject } from '../store/dashboardSlice';

import { IconButton, Snackbar, Alert, Button, Tooltip } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import PanelTemplateDialog from '../components/performance-analysis/PanelTemplateDialog';
import { type PanelTemplate } from '../config/panelTemplates';
import EditIcon from '@mui/icons-material/Edit';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Responsive, WidthProvider } from 'react-grid-layout';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
// import dummy_data from '../dummy_performance_data/dummy_data.json';
import { Header } from '../components/layout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { CollapsibleSection } from '../components/common';
import { type WorkbenchInfo, WorkbenchInfoService } from "../components/aeb-testing/WorkbenchInfoService";

// API base URL for instance details
const MONITORING_ENDPOINT = import.meta.env.REACT_APP_MONITORING_ENDPOINT || 'https://d1-portal.vhub.bosch.tech/metrics';

// TypeScript interface matching the Go InstanceDetails struct
interface InstanceDetails {
  instanceId: string;
  ipAddress: string; // Public IP
  os: string;
  state: string;
  instanceType: string;
  cpuCoreCount: number;
  threadsPerCore: number;
  architecture: string;
  memorySizeInMiB: number;
  rootDeviceName?: string;
  rootDeviceType?: string;
  networkPerformance: string;
}

const ResponsiveGridLayout = WidthProvider(Responsive);

// By default, react-grid-layout shows a transparent red placeholder.
// We can override this with CSS to make it less intrusive and match our theme.
// A dashed border is a common and clear indicator for a drop zone.
const placeholderStyle = `
  .react-grid-layout .react-grid-placeholder {
    background: none !important;
    border: 2px dashed rgba(255, 255, 255, 0.2) !important;
    border-radius: 0.5rem; /* Matches rounded-lg */
  }
`;

const RightSidebar = styled.div`
  grid-column: 3;
  grid-row: 1;
  background-color: #ffffff;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 1px solid #e1e5e9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  height: calc(100vh - 70px - 32px);
  max-height: calc(100vh - 70px - 32px);
  overflow-y: auto;
  overflow-x: hidden;
  
  @media (max-width: 1000px) {
    grid-column: 1;
    grid-row: 3;
    height: auto;
    max-height: none;
    min-height: 400px;
    overflow: visible;
  }
`;

const RightPanelSection = styled.div<{ flex?: number }>`
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  margin-bottom: 2px;
`;

const LeftSidebar = styled.div`
  grid-column: 1;
  grid-row: 1;
  background-color: #ffffff;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid #e1e5e9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  height: calc(100vh - 70px - 32px);
  max-height: calc(100vh - 70px - 32px);
  overflow-y: auto;
  overflow-x: hidden;
  
  @media (max-width: 1000px) {
    grid-column: 1;
    grid-row: 1;
    height: auto;
    max-height: none;
    min-height: 300px;
    overflow: visible;
  }
`;

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr ;
  grid-template-rows: calc(100vh - 70px - 32px);
  height: calc(100vh - 70px);
  gap: 16px;
  padding: 16px;
  background-color: #f0f7ff; /* Light blue background */
  overflow: hidden; /* Prevent content from expanding the grid */
  
  @media (max-height: 800px) {
    /* On smaller screens, reduce padding and gaps */
    padding: 8px;
    gap: 8px;
    grid-template-rows: calc(100vh - 70px - 16px);
  }
  
  @media (max-width: 1400px) {
    /* On smaller width screens, reduce sidebar widths */
    grid-template-columns: 280px 1fr ;
    
  }
  
  @media (max-width: 1200px) {
    /* On even smaller screens, further reduce sidebar widths */
    grid-template-columns: 260px 1fr ;
    gap: 12px;
  }
  
  @media (max-width: 1000px) {
    /* On very small screens, stack vertically */
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    height: auto;
    min-height: calc(100vh - 70px);
    overflow-y: auto;
  }
`;


const Dashboard = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [eventLogShow, setEventLogShow] = useState<string[]>([]);
  const BASE_URL = import.meta.env.REACT_APP_BASE_URL || "https://d1-portal.vhub.bosch.tech";
  const API_KEY ="AKv7yQp9tR2wX5sB8eF4zJ1uL6cN0mV3aT2hG9pQ7xS5dF8wE1rZ6bC3jK0lP4n";
  const userInfo = localStorage.getItem("userInfo");

    // Global workbench information from REST API
    const [globalWorkbenchInfo, setGlobalWorkbenchInfo] = useState<WorkbenchInfo | null>(null);
    var { workspaceId, compoundProductId, provisionedCompoundProductId, productId } = useParams<{
      workspaceId: string;
      compoundProductId: string;
      provisionedCompoundProductId: string;
      productId: string;
    }>();

    
    // Set default values if undefined
    if (!compoundProductId || compoundProductId === 'undefined') {
      compoundProductId = 'default-compound-product-id';
    }

    if (provisionedCompoundProductId === 'undefined') {
      provisionedCompoundProductId = 'provisioned-compound-product-id';
    }

    if (!productId || productId === 'undefined') {
      productId = 'observability-node';
    }


    const addEventLogs = async (log: string) => {
    setEventLogShow((prev) => [...prev, log]);
  };

  const createApiHeaders = (userInfo?: string | null) => {
    let ntid: string | null = null;

    try {
      ntid = userInfo ? JSON.parse(userInfo)?.uniqueName?.split("@")[0] : null;
    } catch {
      ntid = null;
    }

    return {
      "Content-Type": "application/json",
      Accept: "*/*",
      "x-api-key": API_KEY,
      ...(ntid && { "x-ntid": ntid }),
    };
  };


 const fetchWorkbenchInfoFromServer = async (): Promise<WorkbenchInfo | null> => {
    try {
      console.log('Fetching workbench info from server...');
      await addEventLogs('Fetching workbench information...');
      
      const workbenchService_url = `${BASE_URL}/api/v1/vews/products/provisioned/data-stream?provisionedCompoundProductId=${provisionedCompoundProductId}`;
      const workbenchService = new WorkbenchInfoService(workbenchService_url);
      const headers = createApiHeaders(userInfo);
      const workbenchInfo = await workbenchService.fetchWorkbenchInfoWithHeaders(headers);
      
      console.log('Workbench info received:', workbenchInfo);
      setGlobalWorkbenchInfo(workbenchInfo);
      
      // Log each machine status
      await addEventLogs(`OD Machine: ${workbenchInfo.odStatus || 'UNKNOWN'}`);
      await addEventLogs(`CarMaker Machine: ${workbenchInfo.carmakerStatus || 'UNKNOWN'}`);
      
      // Overall system status
      const bothRunning = workbenchInfo.odStatus === 'RUNNING' && workbenchInfo.carmakerStatus === 'RUNNING';
      if (bothRunning) {
        await addEventLogs('All machines ready for testing');
      } else {
        await addEventLogs('Some machines not running - check status');
      }
      
      return workbenchInfo;
    } catch (error) {
      console.error('Error fetching workbench info:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await addEventLogs(`Error fetching workbench info: ${errorMessage}`);
      await addEventLogs('Using default configuration');
      
      return null;
    }
  };


  // Get the entire dashboard state for saving, and panels for rendering
  const dashboardState = useSelector((state: RootState) => state.dashboard);
  const { panels, instanceDetails } = dashboardState;
  
  // Filter panels based on the selected operating system and compound product context
  const filteredPanels = useMemo(() => {
    if (!productId) return panels;
    return panels.filter(panel => {
      // For backward compatibility, show panels without specific identifiers
      if (!panel.operatingSystem && !panel.compoundProductId && !panel.instanceId) {
        return true;
      }
      
      // Match by compound product and instance/OS
      const matchesCompoundProduct = !panel.compoundProductId || 
        panel.compoundProductId === compoundProductId;
      
      const matchesInstance = panel.operatingSystem === productId ||
        panel.instanceId === productId ||
        !panel.operatingSystem; // Backward compatibility
        
      return matchesCompoundProduct && matchesInstance;
    });
  }, [panels, productId, compoundProductId]);
  
    const [activeTab, setActiveTab] = useState<string>(`/${workspaceId}/${compoundProductId}/${provisionedCompoundProductId}`);
  const [notification, setNotification] = useState({ open: false, message: '' });
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Static list of instance IDs for the compound product
  // TODO: These instance IDs will be filled via an API call with compound-product-id as the parameter
  const instanceIds = ['i-02c9f9d0753383475', 'i-0d7223d32eab3b6e9'];

  // Fetch workbench info on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      // First fetch workbench info (this will set globalWorkbenchInfo state)
      await fetchWorkbenchInfoFromServer();
    };

    fetchAllData();
  }, []);

        const fetchInstanceDetails = async (instanceId: string) => {
        try {
          console.log(`Fetching details for workbench instance ${instanceId}...`);
          const response = await fetch(`${MONITORING_ENDPOINT}/control-node/instance/details?instanceId=${instanceId}`);
          if (response.ok) {
            const details = await response.json();
            console.log(`Fetched details for workbench instance ${instanceId}:`, details);
            dispatch(setInstanceDetails({
              compoundProductId: compoundProductId || 'default-compound-product-id',
              provisionedCompoundProductId: provisionedCompoundProductId || 'provisioned-compound-product-id',
              instanceId: instanceId,
              details
            }));
          } else {
            console.error(`Failed to fetch details for workbench instance ${instanceId}: ${response.status} ${response.statusText}`);
            // Create mock data based on workbench type
            const isCarMaker = instanceId === globalWorkbenchInfo?.carmakerWorkbenchId;
            const mockDetails = {
              instanceId: instanceId,
              ipAddress: isCarMaker ? '3.121.237.172' : '18.195.123.45',
              os: isCarMaker ? 'Windows' : 'Linux',
              state: isCarMaker ? globalWorkbenchInfo?.carmakerStatus : globalWorkbenchInfo?.odStatus,
              instanceType: 'it3.medium',
              cpuCoreCount: 2,
              threadsPerCore: 2,
              architecture: 'x86_64',
              memorySizeInMiB: 4096,
              rootDeviceName: '/dev/sda1',
              rootDeviceType: 'ebs',
              networkPerformance: 'Up to 5 Gigabit'
            };
            dispatch(setInstanceDetails({
              compoundProductId: compoundProductId || 'default-compound-product-id',
              provisionedCompoundProductId: provisionedCompoundProductId || 'provisioned-compound-product-id',
              instanceId: instanceId,
              details: mockDetails
            }));
          }
        } catch (error) {
          console.error(`Failed to fetch details for workbench instance ${instanceId}:`, error);
          // Create mock data based on workbench type for error fallback
          const isCarMaker = instanceId === globalWorkbenchInfo?.carmakerWorkbenchId;
          const mockDetails = {
            instanceId: instanceId,
            ipAddress: isCarMaker ? '3.121.237.172' : '18.195.123.45',
            os: isCarMaker ? 'Windows' : 'Linux',
            state: isCarMaker ? globalWorkbenchInfo?.carmakerStatus : globalWorkbenchInfo?.odStatus,
            instanceType: 'it3.medium',
            cpuCoreCount: 2,
            threadsPerCore: 2,
            architecture: 'x86_64',
            memorySizeInMiB: 4096,
            rootDeviceName: '/dev/sda1',
            rootDeviceType: 'ebs',
            networkPerformance: 'Up to 5 Gigabit'
          };
          dispatch(setInstanceDetails({
            compoundProductId: compoundProductId || 'default-compound-product-id',
            provisionedCompoundProductId: provisionedCompoundProductId || 'provisioned-compound-product-id',
            instanceId: instanceId,
            details: mockDetails
          }));
        }
      };

  // Fetch instance details when globalWorkbenchInfo is updated
  useEffect(() => {
    if (globalWorkbenchInfo && (globalWorkbenchInfo.carmakerWorkbenchId || globalWorkbenchInfo.odWorkbenchId)) {
      console.log('Fetching instance details for workbench instances...');
      
      const workbenchInstanceIds = [
        globalWorkbenchInfo.carmakerWorkbenchId,
        globalWorkbenchInfo.odWorkbenchId
      ].filter(Boolean); // Remove any null/undefined values



      // Fetch details for workbench instance IDs
      console.log('Workbench instance IDs to fetch:', workbenchInstanceIds);
      workbenchInstanceIds.forEach(instanceId => {
        fetchInstanceDetails(instanceId);
      });
    } else {
      console.log('default instance IDs to fetch:', instanceIds);
      instanceIds.forEach(instanceId => {
        fetchInstanceDetails(instanceId);
      });
      console.log('No workbench info available, skipping instance details fetch');
    }
  }, [globalWorkbenchInfo, dispatch, compoundProductId, provisionedCompoundProductId]);

  useEffect(() => {
    if (location.state?.message) {
      setNotification({ open: true, message: location.state.message });
      // Clear the state from the location so the message doesn't reappear on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleCloseNotification = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  const handleAddPanel = () => {
    setTemplateDialogOpen(true);
  };

  const handleSelectTemplate = (templates: PanelTemplate[]) => {
    // Get OS type from instance details if available
    let osType = productId;
    if (compoundProductId && 
        provisionedCompoundProductId &&
        productId && 
        productId !== 'observability-node' && 
        instanceDetails?.[compoundProductId]?.[provisionedCompoundProductId]?.[productId]?.details) {
      // Extract OS type from instance details using the correct field name
      const details = instanceDetails[compoundProductId][provisionedCompoundProductId][productId].details;
      osType = details.os || productId;
    }
    
    // Merge all selected templates into a single panel
    const combinedQueries: QueryObject[] = [];
    const templateNames: string[] = [];
    const templateDescriptions: string[] = [];
    
    templates.forEach((template) => {
      templateNames.push(template.name);
      if (template.description) templateDescriptions.push(template.description);
      template.config.queries.forEach(q => {
        combinedQueries.push({
          id: q.id || uuidv4(),
          query: q.query,
          units: q.units,
          resolution: q.resolution,
          series: q.series || [],
        });
      });
    });

    const newPanel: PanelConfig = {
      id: uuidv4(),
      title: templateNames.join(' + '),
      queries: combinedQueries,
      description: templateDescriptions.join(' | '),
      operatingSystem: osType,
      compoundProductId: compoundProductId || 'default-compound-product-id',
      instanceId: productId !== 'observability-node' ? productId : undefined,
    };
    
    dispatch(addPanel(newPanel));
    navigate(`/${workspaceId}/${compoundProductId}/${provisionedCompoundProductId}/${productId}/performance-monitoring-dashboard/edit-panel/${newPanel.id}`);
  };


  const handleDownloadDashboard = () => {
    const stateToSave = JSON.stringify(dashboardState, null, 2);
    const blob = new Blob([stateToSave], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dashboard-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('File content is not a string.');
        const loadedState = JSON.parse(text);

        if (!Array.isArray(loadedState.panels)) {
          throw new Error("Invalid dashboard configuration file. Missing 'panels' array.");
        }

        dispatch(setDashboardState(loadedState));
        setNotification({ open: true, message: 'Dashboard loaded successfully!' });
      } catch (error) {
        alert(`Failed to load dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  // Dynamically generate layouts for all breakpoints
  const generateLayouts = () => {
    const breakpoints = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
    const layouts: { [key: string]: ReactGridLayout.Layout[] } = {};

    for (const breakpoint of Object.keys(breakpoints)) {
      const cols = breakpoints[breakpoint as keyof typeof breakpoints];
      // Use 2 columns for larger screens, 1 for smaller ones
      const itemsPerRow = cols >= 6 ? 2 : 1;
      const panelWidth = Math.floor(cols / itemsPerRow);

      const layout = filteredPanels.map((panel, index) => ({
        i: panel.id,
        x: (index * panelWidth) % cols,
        y: Math.floor((index * panelWidth) / cols) * 2,
        w: panelWidth,
        h: 2,
      }));

      layout.push({
        i: 'add-panel-placeholder',
        x: (filteredPanels.length * panelWidth) % cols,
        y: Math.floor((filteredPanels.length * panelWidth) / cols) * 2,
        w: panelWidth,
        h: 2,
        // static: true,
      });
      layouts[breakpoint] = layout;
    }
    return layouts;
  };

  return (
    <>
    <Header activeTab={activeTab} setActiveTab={setActiveTab} backto='Dashboard'/>
    <DashboardContainer>

    <div className="space-y-6 h-screen overflow-y-scroll ">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="application/json"
        />
      <div className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-end items-center">
        <div style={{ flexGrow: 1, fontSize: '18px', fontWeight: 'bold' }}>
        Performance Monitoring Dashboard
        </div>
        <div className='flex items-center gap-4'>
        <Button onClick={handleUploadClick} variant="outlined" startIcon={<FileUploadIcon />}>
          Upload Dashboard
        </Button>
        <Button
          onClick={handleDownloadDashboard}
          variant="outlined"
          startIcon={<FileDownloadIcon />}
        >
          Download Dashboard
        </Button>
        </div>
      </div>
      <style>{placeholderStyle}</style>
    <ResponsiveGridLayout
      className="layout"
      layouts={generateLayouts()}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={200} // Adjust row height to your liking
      draggableHandle=".drag-handle"
      draggableCancel=".no-drag" // Prevent dragging when clicking on the edit link
    >
      {filteredPanels.map((panel) => (
        <div key={panel.id} className="bg-gray-100 rounded-lg overflow-hidden flex flex-col shadow-md border border-gray-200">
          <div className="drag-handle cursor-move p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 text-sm">{panel.title}</span>
              {panel.description && (
                <Tooltip title={panel.description} placement="top" arrow>
                  <span
                    className="no-drag"
                    style={{ display: 'inline-flex', alignItems: 'center', color: '#666', cursor: 'help' }}
                  >
                    <InfoOutlinedIcon fontSize="small" />
                  </span>
                </Tooltip>
              )}
            </div>
            <IconButton
              component={RouterLink}
              to={`/${workspaceId}/${compoundProductId}/${provisionedCompoundProductId}/${productId}/performance-monitoring-dashboard/edit-panel/${panel.id}`}
              
              className="no-drag"
              size="small"
              aria-label="Edit Panel"
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                color: '#333',
                '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                },
                borderRadius: 1, // Makes the button square
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </div>
          <div className="flex-grow min-h-0">
            <ChartPanel 
              query={panel.queries} 
              title={panel.title} 
              instanceId={productId}
              instanceDetails={compoundProductId && provisionedCompoundProductId && productId ? instanceDetails?.[compoundProductId]?.[provisionedCompoundProductId]?.[productId]?.details : undefined}
            /> {/* @TODO: Remove dummy data */}
          </div>
        </div>
      ))}
      {/* Add Panel Tile */}
      <div key="add-panel-placeholder" className="bg-gray-100 rounded-lg shadow-md border border-gray-200">
        <button
          onClick={handleAddPanel}
          className="w-full h-full flex flex-col items-center justify-center text-gray-500 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
          aria-label="Add new panel"
        >
          <AddIcon sx={{ fontSize: 60, color: 'rgba(0, 0, 0, 0.5)' }} />
          <span className="mt-2 text-lg">Add Panel</span>
        </button>
      </div>
    </ResponsiveGridLayout>
      <Snackbar
        open={notification.open}
        autoHideDuration={2000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity="success" sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </div>

    <LeftSidebar>
          <CollapsibleSection title="Product Metrics Selection" defaultExpanded={true} >
            <div style={{ padding: '8px 0' }}>
              <label htmlFor="compound_product_selection" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Compound Product Selection
              </label>
              <select
                id="compound_product_selection"
                value={compoundProductId}
                // onChange={(e) => handleTargetEnvironmentChange(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
              >
                <option value="basic">{compoundProductId}</option>
                {/* <option value="accurate">Compound Product B</option>
                <option value="databased">Compound Product C</option> */}
              </select>

              <div style={{height:'10px'}}></div>
              <label htmlFor="provisioned_compound_product_selection" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Provisioned Compound Product ID
              </label>
              <select
                id="provisioned_compound_product_selection"
                value={provisionedCompoundProductId}
                onChange={(e) => navigate(`/${workspaceId}/${compoundProductId}/${e.target.value}/${productId}/performance-monitoring-dashboard`)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
              >
                <option value="provisioned-compound-product-id">{provisionedCompoundProductId}</option>
              </select>

              <div style={{height:'10px'}}></div>
              <label htmlFor="product_selection" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Product Selection
              </label>
              <select
                id="product_selection"
                value={productId}
                onChange={(e) => navigate(`/${workspaceId}/${compoundProductId}/${provisionedCompoundProductId}/${e.target.value}/performance-monitoring-dashboard`)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
              >
                <option value="observability-node">Observability Node</option>
                
                {/* Use workbench IDs if available, otherwise use hardcoded instance IDs */}
                {globalWorkbenchInfo?.odWorkbenchId || globalWorkbenchInfo?.carmakerWorkbenchId ? (
                  <>
                    {globalWorkbenchInfo?.odWorkbenchId && (
                      <option value={globalWorkbenchInfo.odWorkbenchId}>
                        OD Workbench ({globalWorkbenchInfo.odStatus}) - {globalWorkbenchInfo.odWorkbenchId}
                      </option>
                    )}
                    {globalWorkbenchInfo?.carmakerWorkbenchId && (
                      <option value={globalWorkbenchInfo.carmakerWorkbenchId}>
                        CarMaker Workbench ({globalWorkbenchInfo.carmakerStatus}) - {globalWorkbenchInfo.carmakerWorkbenchId}
                      </option>
                    )}
                  </>
                ) : (
                  /* Fallback to hardcoded instance IDs when workbench info is not available */
                  instanceIds.map((instanceId) => {
                    const details = compoundProductId && provisionedCompoundProductId ? 
                      instanceDetails?.[compoundProductId]?.[provisionedCompoundProductId]?.[instanceId]?.details : null;
                    const displayName = details?.os ? 
                      `${details.os} (${instanceId})` : 
                      instanceId;
                    return (
                      <option key={instanceId} value={instanceId}>
                        {displayName}
                      </option>
                    );
                  })
                )}
              </select> 
            </div>
          </CollapsibleSection>
          
          {/* Instance Details Section - Only show if an instance is selected */}
          {compoundProductId && 
           provisionedCompoundProductId &&
           productId && 
           productId !== 'observability-node' && 
           instanceDetails?.[compoundProductId]?.[provisionedCompoundProductId]?.[productId] && (
            <CollapsibleSection title="Node Details" defaultExpanded={true}>
              <div style={{ padding: '8px 0' }}>
                {(() => {
                  const details = compoundProductId && provisionedCompoundProductId && productId ? 
                    instanceDetails?.[compoundProductId]?.[provisionedCompoundProductId]?.[productId]?.details : null;
                  
                  // If no details available, show that we're loading
                  if (!details) {
                    return (
                      <div style={{ 
                        backgroundColor: '#f8f9fa', 
                        border: '1px solid #dee2e6', 
                        borderRadius: '4px', 
                        padding: '12px', 
                        fontSize: '12px',
                        textAlign: 'center',
                        color: '#666'
                      }}>
                        Loading instance details...
                      </div>
                    );
                  }
                  
                  return (
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      border: '1px solid #dee2e6', 
                      borderRadius: '4px', 
                      padding: '12px', 
                      fontSize: '12px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <div><strong>OS:</strong> {details.os || 'N/A'}</div>
                        <div><strong>State:</strong> {details.state || 'N/A'}</div>
                        <div><strong>Type:</strong> {details.instanceType || 'N/A'}</div>
                        <div><strong>IP:</strong> {details.ipAddress || 'N/A'}</div>
                        <div><strong>CPU Cores:</strong> {details.cpuCoreCount || 'N/A'}</div>
                        <div><strong>Memory:</strong> {details.memorySizeInMiB ? `${Math.round(details.memorySizeInMiB / 1024)} GB` : 'N/A'}</div>
                        <div><strong>Architecture:</strong> {details.architecture || 'N/A'}</div>
                        <div><strong>Network:</strong> {details.networkPerformance || 'N/A'}</div>
                        <div><strong>Threads/Core:</strong> {details.threadsPerCore || 'N/A'}</div>
                        <div><strong>Root Device:</strong> {details.rootDeviceName || 'N/A'}</div>
                      </div>
                      {/* <details style={{ marginTop: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontSize: '11px', color: '#666' }}>Show Raw JSON</summary>
                        <pre style={{ 
                          margin: '8px 0 0 0', 
                          whiteSpace: 'pre-wrap', 
                          wordBreak: 'break-word',
                          backgroundColor: '#fff',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '3px',
                          fontSize: '10px'
                        }}>
                          {JSON.stringify(details, null, 2)}
                        </pre>
                      </details> */}
                    </div>
                  );
                })()}
              </div>
            </CollapsibleSection>
          )}
          
          <RightPanelSection>
          
          </RightPanelSection>

        </LeftSidebar>
</DashboardContainer>

    <PanelTemplateDialog
      open={templateDialogOpen}
      onClose={() => setTemplateDialogOpen(false)}
      onSelectTemplate={handleSelectTemplate}
      operatingSystem={
        compoundProductId &&
        provisionedCompoundProductId &&
        productId &&
        productId !== 'observability-node' && 
        instanceDetails?.[compoundProductId]?.[provisionedCompoundProductId]?.[productId]?.details 
          ? (instanceDetails[compoundProductId][provisionedCompoundProductId][productId].details?.os || productId)
          : productId || 'observability-node'
      }
    />
    
    </>

  );
};

export default Dashboard;