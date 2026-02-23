import { Icon, Tooltip } from '@bosch/react-frok';
import React from 'react';
import WorkspaceMenu from './WorkspaceMenu';
import { useDrawerStore } from '@stores/drawerStore';
import Drawer from '@components/Drawer';
import VariantsProvisioningDrawer from '@components/VariantsProvisioningDrawer';
import { Workspace } from 'src/types/workspace.type';
import FormEditWorkspace from '@components/molecules/forms/FormEditWorkspace';
import { WORKSPACE_PAGE_CONSTANTS } from '@constants/workspace.constants';

interface WorkspaceHeaderProps {
  workspace: Workspace;
  isAdmin: boolean;
  activeWorkspaceMenu: string | number | null;
  onToggleMenu: (workspaceId: string | number) => void;
  onAssignUser: () => void;
  onDeleteWorkspace: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  workspace,
  isAdmin,
  activeWorkspaceMenu,
  onToggleMenu,
  onAssignUser,
  onDeleteWorkspace,
  menuRef,
}) => {
  const { openDrawer, closeDrawer } = useDrawerStore();

  const handleOpenDrawer = () => {
    openDrawer(
      WORKSPACE_PAGE_CONSTANTS.DRAWER.VARIANTS_PROVISIONING.id,
      <VariantsProvisioningDrawer workspace={workspace} />
    );
  };

  const handleOpenEditDetailsDrawer = () => {
    openDrawer(
      WORKSPACE_PAGE_CONSTANTS.DRAWER.EDIT_WORKSPACE.id,
      <FormEditWorkspace
        workspace={workspace}
        onCancelEditWorkspace={() => closeDrawer(WORKSPACE_PAGE_CONSTANTS.DRAWER.EDIT_WORKSPACE.id)}
      />
    );
  };

  return (
    <div className="flex w-full items-center justify-between">
      <Tooltip tooltipWidth="fixed" content={workspace?.workspaceName}>
        <div className="max-w-72 lg:max-w-96">
          <p className="truncate text-2xl font-bold">{workspace?.workspaceName}</p>
        </div>
      </Tooltip>
      <div className="flex items-start gap-2">
        <Icon iconName="refresh-cloud" className="cursor-pointer hover:text-bosch-blue" onClick={handleOpenDrawer} />
        {isAdmin && (
          <div className="relative">
            <Icon
              iconName="options-vertical"
              className="cursor-pointer hover:text-bosch-blue"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleMenu(workspace.id);
              }}
            />
            <WorkspaceMenu
              isOpen={activeWorkspaceMenu === workspace.id}
              workspace={workspace}
              isAdmin={isAdmin}
              onEditDetails={handleOpenEditDetailsDrawer}
              onAssignUser={onAssignUser}
              onDeleteWorkspace={onDeleteWorkspace}
              menuRef={menuRef}
            />
          </div>
        )}
      </div>
      <Drawer
        drawerName={WORKSPACE_PAGE_CONSTANTS.DRAWER.VARIANTS_PROVISIONING.id}
        title={WORKSPACE_PAGE_CONSTANTS.DRAWER.VARIANTS_PROVISIONING.title}
      />
      <Drawer
        drawerName={WORKSPACE_PAGE_CONSTANTS.DRAWER.EDIT_WORKSPACE.id}
        title={WORKSPACE_PAGE_CONSTANTS.DRAWER.EDIT_WORKSPACE.title}
      />
      <Drawer drawerName="modifyWorkspaceUsers" title="Modify Workspace Users" />
    </div>
  );
};

export default WorkspaceHeader;
