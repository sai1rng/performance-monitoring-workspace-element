import { useMsal } from '@azure/msal-react';
import { SideNavigation } from '@bosch/react-frok';
import { useLocation, useNavigate } from 'react-router-dom';
import { pageTitles } from '../routes/index';
import { handleLogout } from '../services/auth.service';
import { getCurrentUserRole, hasFeatureAccess } from '../utils/auth';

const SideBar = () => {
  const navigate = useNavigate();
  const userRole = getCurrentUserRole();
  const { instance } = useMsal();

  const handleLogoutClick = async () => {
    try {
      handleLogout(instance);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  const location = useLocation();

  // Create a map from routes to menu item values using page titles
  // This helps to find the selected sidebar item based on current path
  const routeToValueMap: Record<string, string> = Object.fromEntries(
    Object.entries(pageTitles).map(([route, title]) => [
      route,
      title.replace(/\s+/g, ''), // Remove spaces for value format
    ])
  );

  // Find the selected item based on current path
  const selectedItem = routeToValueMap[location.pathname] || 'MyWorkspace'; // Define sidebar items with their associated features from featureAccessMatrix
  const sidebarItems = [
    {
      icon: 'panel-control',
      label: pageTitles['/workspace'],
      link: {
        as: 'button',
        onClick: () => {
          navigate('/workspace');
        },
      },
      value: routeToValueMap['/workspace'],
      // Workspace is always available to all authenticated users
      feature: null,
    },
    {
      icon: 'desktop-dashboard',
      label: pageTitles['/dashboard'],
      link: {
        as: 'button',
        onClick: () => {
          navigate('/dashboard');
        },
      },
      value: routeToValueMap['/dashboard'],
      // Dashboard is always available to all authenticated users
      feature: null,
    },
    {
      icon: 'settings',
      label: pageTitles['/solution-architect/settings'],
      link: {
        as: 'button',
        onClick: () => {
          navigate('/solution-architect/settings');
        },
      },
      value: routeToValueMap['/solution-architect/settings'],
      feature: 'settings',
    },
    {
      icon: 'keys',
      label: pageTitles['/license-management'],
      link: {
        as: 'button',
        onClick: () => {
          navigate('/license-management');
        },
      },
      value: routeToValueMap['/license-management'],
      feature: 'license-management',
    },
    {
      icon: 'structure',
      label: pageTitles['/system-design'],
      link: {
        as: 'button',
        onClick: () => {
          navigate('/system-design');
        },
      },
      value: routeToValueMap['/system-design'],
      feature: 'system-design',
    },
    {
      icon: 'document-log',
      label: pageTitles['/audit-logs'],
      link: {
        as: 'button',
        onClick: () => {
          navigate('/audit-logs');
        },
      },
      value: routeToValueMap['/audit-logs'],
      feature: 'audit-logs',
    },
    {
      icon: 'desktop-notification',
      label: pageTitles['/admin-notifications'],
      link: {
        as: 'button',
        onClick: () => {
          navigate('/admin-notifications');
        },
      },
      value: routeToValueMap['/admin-notifications'],
      feature: 'admin-notifications',
    },
    {
      icon: 'server-settings',
      label: pageTitles['/admin-settings'],
      link: {
        as: 'button',
        onClick: () => {
          navigate('/admin-settings');
        },
      },
      value: routeToValueMap['/admin-settings'],
      feature: 'admin-settings',
    },
    {
      icon: 'clipboard-list-parts',
      label: pageTitles['/assessment-form'],
      link: {
        as: 'button',
        onClick: () => {
          navigate('/assessment-form');
        },
      },
      value: routeToValueMap['/assessment-form'],
      feature: 'assessment-form',
    },
    {
      icon: 'document-test',
      label: pageTitles['/system-requirements'],
      link: {
        as: 'button',
        onClick: () => {
          navigate('/system-requirements');
        },
      },
      value: routeToValueMap['/system-requirements'],
      feature: 'system-requirements',
    },
    {
      icon: 'team-3',
      label: pageTitles['/user-management'],
      link: {
        as: 'button',
        onClick: () => {
          navigate('/user-management');
        },
      },
      value: routeToValueMap['/user-management'],
      feature: 'user-management',
    },
    {
      icon: 'logout',
      label: 'Logout',
      link: {
        as: 'button',
        onClick: handleLogoutClick,
      },
      value: 'Logout',
      // Logout is always available
      feature: null,
    },
  ];
  // Filter sidebar items based on user role and feature access
  const filteredMenuItems = sidebarItems.filter((item) => {
    // If no feature is associated or user role is undefined, show the item
    if (item.feature === null || !userRole) {
      return true;
    }
    // Otherwise, check if user has access to the feature
    if (typeof item.feature === 'string') {
      return hasFeatureAccess(item.feature, userRole);
    }
    return false;
  });
  return (
    <SideNavigation
      body={{
        menuItems: filteredMenuItems,
      }}
      defaultSelectedItem={routeToValueMap['/workspace']}
      selectedItem={selectedItem}
      header={{
        label: 'vHub',
      }}
    />
  );
};
export default SideBar;
