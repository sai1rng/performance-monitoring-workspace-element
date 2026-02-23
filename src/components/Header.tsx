import { useMsal } from '@azure/msal-react';
import { Badge, Button, MenuItem, MenuItemLabel, MenuItemLink, MinimalHeader } from '@bosch/react-frok';
import { usePageTitle } from '@hooks/usePageTitle';
import { useCountUnreadNotifications, useReadAllNotification } from '@services/notification.query';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import useSelfProfileQuery from '../hooks/useSelfProfile';
import { handleLogout } from '../services/auth.service';
import { SORT_FIELD_CREATED_AT, SORT_DIRECTION_DESC } from '../constants/Constant';
import NotificationPopup from './NotificationPopup';
import SideBar from './SideBar';

interface ContextMenuProps {
  onItemClick: (action: string) => void;
}

const ContextMenu = ({ onItemClick }: ContextMenuProps) => {
  return (
    <div className="absolute left-0 top-full z-10 mt-1 rounded-md border border-bosch-gray-90 bg-white shadow-md">
      <MenuItem>
        <MenuItemLink className="p-0" onClick={() => onItemClick('settings')}>
          <MenuItemLabel label={<Button mode="integrated" label="Dashboard" icon="desktop-dashboard" />} />
        </MenuItemLink>
      </MenuItem>

      <MenuItem>
        <MenuItemLink className="p-0" onClick={() => onItemClick('home')}>
          <MenuItemLabel label={<Button mode="integrated" label="Workspace" icon="panel-control" />} />
        </MenuItemLink>
      </MenuItem>

      <MenuItem>
        <MenuItemLink className="p-0" onClick={() => onItemClick('logout')}>
          <MenuItemLabel label={<Button mode="integrated" label="Logout" icon="logout" />} />
        </MenuItemLink>
      </MenuItem>
    </div>
  );
};

const Header = () => {
  const navigate = useNavigate();
  const { data: user } = useSelfProfileQuery();
  const { instance } = useMsal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const { data: countUnreadNotification } = useCountUnreadNotifications({});
  const pageTitle = usePageTitle();

  const { data: notificationsData } = useReadAllNotification({
    sort: `${SORT_FIELD_CREATED_AT},${SORT_DIRECTION_DESC}`,
  });

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const profileButtonRef = useRef<HTMLElement | null>(null);

  const handleNotificationClick = () => {
    setShowNotification(!showNotification);
  };

  const handleUserProfileClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    profileButtonRef.current = event.currentTarget as HTMLElement;

    setMenuOpen((prevState) => {
      const newState = !prevState;
      return newState;
    });
  }, []);

  const handleMenuItemClick = useCallback(
    (action: string) => {
      setMenuOpen(false);
      switch (action) {
        case 'settings':
          navigate('/dashboard');
          break;
        case 'home':
          navigate('/workspace');
          break;
        case 'logout':
          handleLogout(instance);
          break;
      }
    },
    [navigate, instance]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (profileButtonRef.current && profileButtonRef.current.contains(target)) {
        return;
      }

      if (menuOpen && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    let timeoutId: NodeJS.Timeout;

    if (menuOpen) {
      timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const primaryRole = user?.roles && user.roles.length > 0 ? user.roles[0] : null;

  const NotificationButtonWrapper = styled.div`
    position: relative;
    display: inline-block;
  `;

  const StyledBadge = styled(Badge)`
    position: absolute;
    top: 0.3rem;
    right: 0rem;
    font-size: 0.7rem;
    width: 50%;
  `;

  return (
    <div className="relative">
      <MinimalHeader
        actions={[
          {
            icon: 'my-brand-frame',
            label: (
              <div ref={userMenuRef} className="relative">
                <div>{user?.name || 'Unknown User'}</div>
                {primaryRole && (
                  <span className="rounded-sm bg-bosch-gray-90 px-2 text-xs font-[500] uppercase text-bosch-gray-35">
                    {String(primaryRole)}
                  </span>
                )}
                {menuOpen && <ContextMenu onItemClick={handleMenuItemClick} />}
              </div>
            ),
            showLabel: true,
            onClick: handleUserProfileClick,
          },
          {
            label: (
              <NotificationButtonWrapper>
                <Button icon="notification" mode="integrated" />
                {(countUnreadNotification?.unreadCount ?? 0) > 0 && (
                  <StyledBadge
                    label={
                      (countUnreadNotification?.unreadCount ?? 0) > 99
                        ? '99+'
                        : (countUnreadNotification?.unreadCount ?? 0)
                    }
                    type="error"
                  />
                )}
              </NotificationButtonWrapper>
            ),
            showLabel: true,
            onClick: handleNotificationClick,
          },
        ]}
        logo={{
          'aria-label': 'HOME',
          title: 'HOME',
          onClick: () => {
            navigate('/');
          },
          style: { cursor: 'pointer' },
        }}
        sideNavigation={<SideBar />}
      >
        {pageTitle}
      </MinimalHeader>
      {showNotification && (
        <NotificationPopup
          listNotification={notificationsData}
          showNotification={showNotification}
          setShowNotification={setShowNotification}
        />
      )}
    </div>
  );
};

export default Header;
