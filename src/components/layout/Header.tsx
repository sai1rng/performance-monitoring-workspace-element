import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: #005691; /* Bosch blue */
  color: white;
  padding: 16px 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
`;

const Logo = styled.h1`
  font-size: 24px;
  margin: 0;
  color: white;
  font-weight: 600;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;

  > div:last-child {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
`;

const UserIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
`;

const MenuContainer = styled.div`
  position: relative;
`;

const HamburgerIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-size: 18px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const DropdownMenu = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'show',
})<{ show: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 1000;
  opacity: ${props => props.show ? 1 : 0};
  visibility: ${props => props.show ? 'visible' : 'hidden'};
  transform: translateY(${props => props.show ? '8px' : '0px'});
  transition: all 0.2s ease-in-out;
`;

const DropdownHeader = styled.div`
  padding: 16px 20px 12px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #333;
  font-weight: 600;
`;

const CloseIcon = styled.div`
  cursor: pointer;
  color: #666;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const DropdownItems = styled.ul`
  list-style: none;
  margin: 0;
  padding: 8px 0;
`;

const DropdownItem = styled.li`
  padding: 12px 20px;
  cursor: pointer;
  color: #333;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }

  i {
    width: 16px;
    color: #005691;
  }
`;



// We still maintain the interface for backward compatibility, but simplified the component
interface HeaderProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  backto: string;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, backto }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isValidUser, setIsValidUser] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  // Check user authentication on component mount
  useEffect(() => {
    try {
      const storedUserInfo = localStorage.getItem('userInfo');
      const msalAccountKeys = localStorage.getItem('msal.account.keys');

      if (storedUserInfo && msalAccountKeys) {
        const parsedUserInfo = JSON.parse(storedUserInfo);
        setUserInfo(parsedUserInfo);
        setIsValidUser(true);
      } else {
        // In development, create a mock user to avoid authentication issues
        if (process.env.NODE_ENV === 'development') {
          const mockUser = {
            name: 'Dev User',
            displayName: 'Development User',
            roles: ['Developer']
          };
          setUserInfo(mockUser);
          setIsValidUser(true);
        } else {
          setIsValidUser(false);
        }
      }
    } catch (e) {
      // Invalid JSON or other parsing error; treat as not logged in
      if (process.env.NODE_ENV === 'development') {
        const mockUser = {
          name: 'Dev User',
          displayName: 'Development User',
          roles: ['Developer']
        };
        setUserInfo(mockUser);
        setIsValidUser(true);
      } else {
        setIsValidUser(false);
      }
    }
  }, []);

  // Handle logout redirect in a separate effect (only in production)
  useEffect(() => {
    if (!isValidUser && process.env.NODE_ENV === 'production') {
      localStorage.clear();
      window.location.href = '/';
    }
  }, [isValidUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        hamburgerRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !hamburgerRef.current.contains(event.target as Node) &&
        isDropdownOpen
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleMenuItemClick = (action: string) => {
    switch (action) {
      case 'dashboard':
        window.location.href = '/dashboard'; 
        break;
      case 'workspace':
        window.location.href = '/workspace';
        break;
      case 'logout':
        setIsValidUser(false); // This will trigger the logout useEffect
        break;
      default:
        break;
    }
    closeDropdown();
  };

  function RightSidebar(){
  if (activeTab === 'dashboard') {
    return <RightSection>
        <UserInfo>
          <UserIcon>
            <i className="fas fa-user"></i>
          </UserIcon>
          {userInfo ? (
            <div>
              <span>{userInfo.name || userInfo.displayName || 'Unknown User'}</span>
              {userInfo.roles && userInfo.roles.length > 0 && (
                <span style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '4px',
                  padding: '0 6px',
                  fontSize: '11px',
                  lineHeight: '16px',
                }}>{userInfo.roles[0]}</span>
              )}
            </div>
          ) : (
            <span>Unknown User</span>
          )}
        </UserInfo>
        <MenuContainer>
          <HamburgerIcon ref={hamburgerRef} onClick={toggleDropdown}>
            <i className="fas fa-bars"></i>
          </HamburgerIcon>
          <DropdownMenu ref={dropdownRef} show={isDropdownOpen}>
            <DropdownHeader>
              <span>Menu</span>
              <CloseIcon onClick={closeDropdown}>
                <i className="fas fa-times"></i>
              </CloseIcon>
            </DropdownHeader>
            <DropdownItems>
              <DropdownItem onClick={() => handleMenuItemClick('dashboard')}>
                <i className="fas fa-cog"></i>
                <span>Dashboard</span>
              </DropdownItem>
              <DropdownItem onClick={() => handleMenuItemClick('workspace')}>
                <i className="fas fa-home"></i>
                <span>Workspace</span>
              </DropdownItem>
              <DropdownItem onClick={() => handleMenuItemClick('logout')}>
                <i className="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </DropdownItem>
            </DropdownItems>
          </DropdownMenu>
        </MenuContainer>
      </RightSection> 
  } else {
        return <Link to={activeTab}>{`← Back to ${backto}`}</Link>
  }
}


  return (
    <HeaderContainer>
      <Logo>AEB Virtual Testing for NCAP</Logo>
      {RightSidebar()}
    </HeaderContainer>
  );
};

export default Header;