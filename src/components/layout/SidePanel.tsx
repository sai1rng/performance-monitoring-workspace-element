import React from 'react';
import styled from 'styled-components';
import CollapsibleSection from '../common/CollapsibleSection';
import FaultInjectionPanel from '../fault-injection/FaultInjectionPanel';
import ServiceManagementPanel from '../management/ServiceManagementPanel';

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

interface SidePanelProps {
  os: 'linux' | 'windows';
  instanceId?: string;
  onFaultLog: (message: string) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ os, instanceId, onFaultLog }) => {
  return (
    <LeftSidebar>
      <CollapsibleSection title="Fault Injection" defaultExpanded={true}>
        <FaultInjectionPanel os={os} instanceId={instanceId} onFaultLog={onFaultLog} />
      </CollapsibleSection>
      <CollapsibleSection title="Service Management" defaultExpanded={true}>
        <ServiceManagementPanel os={os} instanceId={instanceId} onFaultLog={onFaultLog} />
      </CollapsibleSection>
    </LeftSidebar>
  );
};

export default SidePanel;
