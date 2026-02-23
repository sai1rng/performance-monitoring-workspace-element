import React, { useState, useMemo } from 'react';
import { Tab, TabNavigation, Text, Button } from '@bosch/react-frok';
import styles from './WorkspaceDetailsSidebar.module.css';
import WorkspaceDetailsTab from './WorkspaceDetailsTab';
import WorkspaceVariantsTab from './WorkspaceVariantsTab';
import WorkspaceUsersTab from './WorkspaceUsersTab';
import {
  WORKSPACE_SIDEBAR_TABS,
  WORKSPACE_SIDEBAR_TAB_LABELS,
  WORKSPACE_SIDEBAR_ANIMATION_TIMEOUT,
} from "@constants/Constant";
import { getCurrentUserRole } from "@utils/auth";

interface CompoundProduct {
  id: string;
  versions: any[];
}

interface Workspace {
  workspaceName: string;
  workspaceUrlLink?: string;
  workspaceDescription?: string;
  assignees?: string[];
  compoundProducts?: CompoundProduct[];
}

interface WorkspaceDetailsSidebarProps {
  workspace: Workspace;
  isOpen: boolean;
  onClose: () => void;
}

const WorkspaceDetailsSidebar: React.FC<WorkspaceDetailsSidebarProps> = ({
  workspace,
  isOpen,
  onClose,
}) => {
  const isAdmin = getCurrentUserRole() === "admin";
  const [selectedTab, setSelectedTab] = useState<string>(
    WORKSPACE_SIDEBAR_TABS.DETAILS,
  );
  const [isClosing, setIsClosing] = useState(false);

  const compoundProduct = workspace.compoundProducts?.[0];
  const variantsCount = compoundProduct?.versions?.length ?? 0;

  const usersCount = useMemo(() => workspace.assignees?.length || 0, [workspace.assignees]);

  const tabItems = useMemo(
    () => {
      const tabs: Array<{ name: string; value: string }> = [
        {
          name: WORKSPACE_SIDEBAR_TABS.DETAILS,
          value: WORKSPACE_SIDEBAR_TAB_LABELS.DETAILS,
        },
        {
          name: WORKSPACE_SIDEBAR_TABS.VARIANTS,
          value: `${WORKSPACE_SIDEBAR_TAB_LABELS.VARIANTS} (${variantsCount})`,
        },
      ];

      if (isAdmin) {
        tabs.push({
          name: WORKSPACE_SIDEBAR_TABS.USERS,
          value: `${WORKSPACE_SIDEBAR_TAB_LABELS.USERS} (${usersCount})`,
        });
      }

      return tabs;
    },
    [variantsCount, usersCount, isAdmin],
  );

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, WORKSPACE_SIDEBAR_ANIMATION_TIMEOUT);
  };

  const handleBackdropClick = () => {
    handleClose();
  };

  if (!isOpen && !isClosing) return null;

  if (!isOpen) return null;

  const renderTabContent = () => {
    switch (selectedTab) {
      case WORKSPACE_SIDEBAR_TABS.DETAILS:
        return <WorkspaceDetailsTab workspace={workspace} />;
      case WORKSPACE_SIDEBAR_TABS.VARIANTS:
        return <WorkspaceVariantsTab workspace={workspace} />;
      case WORKSPACE_SIDEBAR_TABS.USERS:
        return <WorkspaceUsersTab workspace={workspace} />;
      default:
        return <WorkspaceDetailsTab workspace={workspace} />;
    }
  };

  return (
    <>
      <div
        className={`${styles.backdrop} ${isClosing ? styles.backdropClosing : ''}`}
        onClick={handleBackdropClick}
        role="presentation"
        aria-hidden="true"
      />

      <div
        className={`${styles.sidebar} ${isOpen && !isClosing ? styles.sidebarOpen : ''} ${isClosing ? styles.sidebarClosing : ''}`}
      >
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <Text className={styles.title}>{workspace.workspaceName}</Text>
          </div>
          <Button onClick={handleClose} icon="close" mode="integrated" />
        </div>

        <div className={styles.tabNavigation}>
          <TabNavigation
            selectedValue={selectedTab}
            onTabSelect={(_, data) => {
              if (data && data.value) {
                setSelectedTab(data.value.toString());
              }
            }}
          >
            {tabItems.map((tab) => (
              <Tab key={tab.name} value={tab.name}>
                {tab.value}
              </Tab>
            ))}
          </TabNavigation>
        </div>

        <div className={styles.content}>{renderTabContent()}</div>
      </div>
    </>
  );
};

export default WorkspaceDetailsSidebar;
