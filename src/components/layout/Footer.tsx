import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background-color: transparent; /* Changed from #333 to transparent */
  color: #666; /* Changed from white to a light gray */
  padding: 8px; /* Reduced padding */
  text-align: center;
  font-size: 12px; /* Reduced font size */
`;

const Footer: React.FC = () => {
    return (
        <FooterContainer>
            {/* Empty footer with no banner */}
        </FooterContainer>
    );
};

export default Footer;