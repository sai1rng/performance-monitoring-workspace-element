import React, { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import styled from 'styled-components';

const StyledButton = styled.button<{ variant?: 'primary' | 'secondary'; disabled?: boolean }>`
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
  width: 100%;
  
  &:hover {
    background-color: ${props => props.disabled ? '#cccccc' : '#4B5563'};
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    background-color: ${props => props.disabled ? '#cccccc' : '#374151'};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

interface FaultInjectionPanelProps {
  os: 'linux' | 'windows';
  instanceId?: string;
  onFaultLog: (message: string) => void;
}

const FaultInjectionPanel: React.FC<FaultInjectionPanelProps> = ({ os, instanceId, onFaultLog }) => {
  const [faultType, setFaultType] = useState('cpu');
  const [duration, setDuration] = useState(10);
  const [networkValue, setNetworkValue] = useState('');
  const [networkInterface, setNetworkInterface] = useState('eth0');
  const [networkSubtype, setNetworkSubtype] = useState('delay');
  
  const MONITORING_ENDPOINT = import.meta.env.REACT_APP_MONITORING_ENDPOINT || 'https://d1-portal.vhub.bosch.tech/metrics';
  const injectFault = async () => {
    if (!faultType) {
      onFaultLog('Please select a fault type');
      return;
    }
    
    let url = `${MONITORING_ENDPOINT}/control-node/host/inject?os=${os}&type=${faultType}&duration=${duration}`;
    if (instanceId) {
      url += `&instanceId=${instanceId}`;
    }
    if (faultType === 'network') {
      url += `&subtype=${networkSubtype}&val=${networkValue}`;
      if (os === 'linux') {
        url += `&interface=${networkInterface}`;
      }
    }
    
    onFaultLog(`Starting ${faultType} fault injection...`);
    
    try {
      const response = await fetch(url);
      const reader = response.body?.getReader();
      
      if (!reader) {
        onFaultLog('Failed to get response reader');
        return;
      }
      
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onFaultLog('Fault injection completed');
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            onFaultLog(line.trim());
          }
        }
      }
    } catch (error) {
      console.error('Failed to inject fault:', error);
      onFaultLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
        <div className="space-y-4">
          <FormControl fullWidth size="small">
            <InputLabel>Fault Type</InputLabel>
            <Select
              value={faultType}
              label="Fault Type"
              onChange={(e) => setFaultType(e.target.value)}
            >
              <MenuItem value="">
                <em>Select Fault Type</em>
              </MenuItem>
              <MenuItem value="cpu">CPU Stress</MenuItem>
              <MenuItem value="memory">Memory Stress</MenuItem>
              <MenuItem value="disk">Disk I/O</MenuItem>
              <MenuItem value="network">Network</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Duration (seconds)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            variant="outlined"
            size="small"
            fullWidth
          />

          {faultType === 'network' && (
            <div className="space-y-2">
              <FormControl fullWidth size="small">
                <InputLabel>Network Fault Type</InputLabel>
                <Select
                  value={networkSubtype}
                  label="Network Fault Type"
                  onChange={(e) => setNetworkSubtype(e.target.value)}
                >
                  <MenuItem value="delay">Delay</MenuItem>
                  <MenuItem value="loss">Packet Loss</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label={networkSubtype === 'delay' ? 'Delay (e.g., 300ms)' : 'Loss Percentage (e.g., 20%)'}
                value={networkValue}
                onChange={(e) => setNetworkValue(e.target.value)}
                variant="outlined"
                size="small"
                fullWidth
              />
              
              {os === 'linux' && (
                <TextField
                  label="Interface (e.g., eth0)"
                  value={networkInterface}
                  onChange={(e) => setNetworkInterface(e.target.value)}
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              )}
            </div>
          )}

          <StyledButton 
            onClick={injectFault} 
            variant="primary"
            disabled={!faultType}
          >
            Inject Fault
          </StyledButton>
        </div>
    </div>
     
  );
};

export default FaultInjectionPanel;
