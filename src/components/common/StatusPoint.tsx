import React from 'react';
import styled from 'styled-components';

const StyledStatus = styled.button<{ disabled?: boolean }>`
  background-color: ${props => props.disabled ? '#cccccc' : '#009157'}; /* Bosch blue */
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background-color: ${props => props.disabled ? '#cccccc' : '#009157'};
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    background-color: ${props => props.disabled ? '#cccccc' : '#009157'};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

interface StatusProps {
  label: string;
  disabled?: boolean;
}

const StatusPoint: React.FC<StatusProps> = ({ label, disabled = false }) => {
  return (
    <StyledStatus disabled={disabled}>
      {label}
    </StyledStatus>
  );
};

export default StatusPoint;