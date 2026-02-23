import React, { useState, useEffect } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import styled from 'styled-components';

const StyledButton = styled.button<{ variant?: 'primary' | 'success' | 'error' | 'info'; disabled?: boolean }>`
  background-color: ${props => props.disabled ? '#cccccc' : '#6B7280'}; /* Professional Gray like AEB */
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex: 1;
  margin-bottom: 4px;
  
  &:hover {
    background-color: ${props => props.disabled ? '#cccccc' : '#4B5563'};
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    background-color: ${props => props.disabled ? '#cccccc' : '#374151'};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  width: 100%;
`;

interface ServiceManagementPanelProps {
  os: 'linux' | 'windows';
  instanceId?: string;
  onFaultLog: (message: string) => void;
}

interface Container {
  id: string;
  name: string;
}

const ServiceManagementPanel: React.FC<ServiceManagementPanelProps> = ({ os, instanceId, onFaultLog }) => {
  const [serviceName, setServiceName] = useState('');
  const [containerId, setContainerId] = useState('');
  const [containers, setContainers] = useState<Container[]>([]);
  const MONITORING_ENDPOINT = import.meta.env.REACT_APP_MONITORING_ENDPOINT || 'https://d1-portal.vhub.bosch.tech/metrics';
  useEffect(() => {
    if (os === 'linux') {
      let url = `${MONITORING_ENDPOINT}/control-node/docker/list?os=${os}`;
      if (instanceId) {
        url += `&instanceId=${instanceId}`;
      }
      console.log('Fetching containers from:', url);
      fetch(url)
        .then(res => res.json())
        .then(data => {
          console.log('Container list response:', data);
          
          // Handle new response structure
          if (data && data.status_code === 200 && data.message && data.message.data && Array.isArray(data.message.data.containers)) {
            console.log('Containers found:', data.message.data.containers);
            
            const containerData = data.message.data.containers.map((c: any) => ({
              id: c.id,
              name: c.name,
            }));
            
            console.log('Final containers list:', containerData);
            setContainers(containerData);
          } else {
            console.log('Invalid response format or no containers found');
            setContainers([]);
          }
        })
        .catch(err => {
          console.error("Failed to fetch containers", err);
          onFaultLog(`Error fetching containers: ${err.message}`);
          setContainers([]);
        });
    }
  }, [os, instanceId]);

  const manageService = async (action: 'start' | 'stop' | 'status') => {
    let url = `${MONITORING_ENDPOINT}/control-node/host/service?os=${os}`;
    if (instanceId) {
      url += `&instanceId=${instanceId}`;
    }
    onFaultLog(`Executing service ${action} on ${serviceName}...`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: serviceName, action }),
      });
      const data = await response.text();
      onFaultLog(`Service ${action} result: ${data}`);
      console.log(`Service action '${action}' on '${serviceName}': ${data}`);
    } catch (error) {
      console.error(`Failed to ${action} service:`, error);
      onFaultLog(`Error: Failed to ${action} service - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const manageContainer = async (action: 'start' | 'stop' | 'status') => {
    let url = `${MONITORING_ENDPOINT}/control-node/docker/${action}?os=${os}`;
    if (instanceId) {
      url += `&instanceId=${instanceId}`;
    }
    
    let payload: any = { container_id: containerId };
    
    let options: RequestInit = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
    if (action === 'status') {
        url += `&container_id=${containerId}`;
        options = { method: 'GET' };
    }
    
    onFaultLog(`Executing container ${action} on ${containerId}...`);
    
    try {
      const response = await fetch(url, options);
      const data = await response.text();
      onFaultLog(`Container ${action} result: ${data}`);
      console.log(`Container action '${action}' on '${containerId}': ${data}`);
    } catch (error) {
      console.error(`Failed to ${action} container:`, error);
      onFaultLog(`Error: Failed to ${action} container - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
        {os === 'windows' && (
          <div className="space-y-2">
            <TextField
              label="Service Name (e.g., windows_exporter)"
              value={serviceName || 'windows_exporter'}
              onChange={(e) => setServiceName(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
            />
            <ButtonGroup>
              <StyledButton onClick={() => manageService('start')} variant="primary">Start</StyledButton>
              <StyledButton onClick={() => manageService('stop')} variant="primary">Stop</StyledButton>
              <StyledButton onClick={() => manageService('status')} variant="primary">Status</StyledButton>
            </ButtonGroup>
          </div>
        )}
        {os === 'linux' && (
          <div className="space-y-2">
            <FormControl fullWidth size="small">
              <InputLabel>Container</InputLabel>
              <Select
                value={containerId}
                label="Container"
                onChange={(e) => setContainerId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Select Container</em>
                </MenuItem>
                {containers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <ButtonGroup>
              <StyledButton onClick={() => manageContainer('start')} variant="primary">Start</StyledButton>
              <StyledButton onClick={() => manageContainer('stop')} variant="primary">Stop</StyledButton>
              <StyledButton onClick={() => manageContainer('status')} variant="primary">Status</StyledButton>
            </ButtonGroup>
          </div>
        )}
    </div>
  );
};

export default ServiceManagementPanel;
