import React, { useState } from 'react';
import styled from 'styled-components';

const SectionContainer = styled.div`
  margin-bottom: 2px;
`;

const SectionHeader = styled.div<{ $isExpanded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: ${(props: { $isExpanded: boolean }) => props.$isExpanded ? '#005691' : '#f5f6f7'};
  color: ${(props: { $isExpanded: boolean }) => props.$isExpanded ? '#ffffff' : '#333333'};
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  border-left: 3px solid ${(props: { $isExpanded: boolean }) => props.$isExpanded ? '#004580' : '#cccccc'};
  
  &:hover {
    background-color: ${(props: { $isExpanded: boolean }) => props.$isExpanded ? '#004580' : '#005691'};
    color: #ffffff;
    border-left-color: #004580;
  }
`;

const SectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
`;

const ExpandIcon = styled.div<{ $isExpanded: boolean }>`
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
  }
  
  svg {
    width: 10px;
    height: 10px;
    transform: ${(props: { $isExpanded: boolean }) => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
    transition: transform 0.2s ease;
  }
`;

const SectionContent = styled.div<{ $isExpanded: boolean; $allowLargeContent?: boolean }>`
  overflow: hidden;
  transition: max-height 0.25s ease-out;
  max-height: ${(props: { $isExpanded: boolean; $allowLargeContent?: boolean }) => 
    props.$isExpanded 
      ? (props.$allowLargeContent ? 'none' : 'auto')
      : '0px'
  };
  background-color: transparent;
`;

const ContentWrapper = styled.div`
  padding: 16px 0 16px 0;
`;

const CompactIndicator = styled.div`
  font-size: 10px;
  color: #666666;
  background-color: #e9ecef;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
`;

// Simple chevron icon
const ChevronIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6,9 12,15 18,9"></polyline>
  </svg>
);

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: string;
  compactText?: string;
  allowLargeContent?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = true,
  icon,
  compactText,
  allowLargeContent = false
}: CollapsibleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <SectionContainer>
      <SectionHeader 
        $isExpanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <SectionTitle>
          {icon && <IconWrapper>{icon}</IconWrapper>}
          {title}
          {!isExpanded && compactText && (
            <CompactIndicator>{compactText}</CompactIndicator>
          )}
        </SectionTitle>
        <ExpandIcon $isExpanded={isExpanded}>
          <ChevronIcon />
        </ExpandIcon>
      </SectionHeader>
      <SectionContent $isExpanded={isExpanded} $allowLargeContent={allowLargeContent}>
        <ContentWrapper>
          {children}
        </ContentWrapper>
      </SectionContent>
    </SectionContainer>
  );
};

export default CollapsibleSection;