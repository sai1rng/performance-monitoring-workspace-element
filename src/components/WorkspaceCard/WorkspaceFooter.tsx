import { Button } from '@bosch/react-frok';
import { FC, useState } from 'react';
import { Workspace } from 'src/types/workspace.type';
import WorkspaceDetailsSidebar from './WorkspaceDetailsSidebar';

interface WorkspaceFooterProps {
  workspace: Workspace;
  onLaunchVariants: (workspace: Workspace, title?: string) => void;
}

const WorkspaceFooter: FC<WorkspaceFooterProps> = ({ workspace, onLaunchVariants }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const existCompoundProducts = workspace.compoundProducts && workspace.compoundProducts.length > 0;

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleLaunchVariants = () => {
    if (!existCompoundProducts) {
      return;
    }
    onLaunchVariants(workspace, 'Launch Variant');
  };

  return (
    <div className="mt-11 flex flex-col gap-3 lg:flex-row">
      <div className="flex-1">
        <Button
          fixedWidth
          label="View Details"
          mode="secondary"
          className="flex !w-full items-center justify-center"
          onClick={handleOpenSidebar}
        />
      </div>
      <div className="flex-1">
        <Button
          fixedWidth
          icon="externallink"
          label="Launch Variant"
          className="flex !w-full items-center justify-center"
          onClick={handleLaunchVariants}
          disabled={!existCompoundProducts}
        />
      </div>

      <WorkspaceDetailsSidebar workspace={workspace} isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
    </div>
  );
};

export default WorkspaceFooter;
