import React from 'react';
import styled from 'styled-components';

const StyledButton = styled.button<{ disabled?: boolean }>`
  background-color: ${props => props.disabled ? '#cccccc' : '#6B7280'}; /* Professional Gray */
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
    background-color: ${props => props.disabled ? '#cccccc' : '#4B5563'};
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    background-color: ${props => props.disabled ? '#cccccc' : '#374151'};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return (
    <StyledButton onClick={onClick} disabled={disabled}>
      {label}
    </StyledButton>
  );
};

export default Button;