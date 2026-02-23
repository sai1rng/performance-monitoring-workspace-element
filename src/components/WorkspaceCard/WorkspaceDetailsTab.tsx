import React from 'react';
import { Text } from '@bosch/react-frok';
import { Link } from 'react-router-dom';
import styles from './WorkspaceDetailsSidebar.module.css';

interface Workspace {
  workspaceName: string;
  workspaceUrlLink?: string;
  workspaceDescription?: string;
  assignees?: string[];
}

interface WorkspaceDetailsTabProps {
  workspace: Workspace;
}

const WorkspaceDetailsTab: React.FC<WorkspaceDetailsTabProps> = ({ workspace }) => {
  return (
    <div className={styles.tabContent}>
      <div className={styles.section}>
        <Text className="font-semibold">Workspace URL</Text>
        <div>
          <Text as="div">
            {workspace.workspaceUrlLink ? (
              <Link to={workspace.workspaceUrlLink} target="_blank">
                {workspace.workspaceUrlLink}
              </Link>
            ) : (
              'No URL available'
            )}
          </Text>
        </div>
      </div>

      <div className={styles.section}>
        <Text className="font-semibold">Description</Text>
        <Text as="div">{workspace.workspaceDescription || 'No description available'}</Text>
      </div>
    </div>
  );
};

export default WorkspaceDetailsTab;
