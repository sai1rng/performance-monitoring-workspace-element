import { Button, MenuItem, MenuItemLabel, MenuItemLink } from '@bosch/react-frok';
import ModifyWorkspaceUserDrawer from '@components/ModifyWorkspaceUserDrawer';
import { useDrawerStore } from '@stores/drawerStore';
import React from 'react';
import { Workspace } from 'src/types/workspace.type';

interface WorkspaceMenuProps {
  isOpen: boolean;
  workspace: Workspace;
  isAdmin: boolean;
  onEditDetails: () => void;
  onAssignUser: () => void;
  onDeleteWorkspace: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
}

const WorkspaceMenu: React.FC<WorkspaceMenuProps> = ({
  isOpen,
  workspace,
  isAdmin,
  onEditDetails,
  onAssignUser,
  onDeleteWorkspace,
  menuRef,
}) => {
  if (!isOpen) return null;

  const isAEBVirtualTesting = workspace.workspaceName === 'AEB Virtual Testing';
  const canShowAssignUser = isAEBVirtualTesting ? isAdmin : true;
  const canShowDelete = !isAEBVirtualTesting;
  const { openDrawer } = useDrawerStore();

  const handleOpenDrawer = () => {
    openDrawer('modifyWorkspaceUsers', <ModifyWorkspaceUserDrawer workspace={workspace} />);
  };

  return (
    <div ref={menuRef} className="z-5 absolute right-full top-0 w-56 border bg-white shadow-sm">
      <MenuItem>
        <MenuItemLink className="p-0" onClick={onEditDetails}>
          <MenuItemLabel label={<Button icon="edit" label="Edit Details" mode="integrated" />} />
        </MenuItemLink>
      </MenuItem>
      {canShowAssignUser && (
        <MenuItem>
          <MenuItemLink className="p-0" onClick={handleOpenDrawer}>
            <MenuItemLabel label={<Button icon="user-service" label="Modify Users" mode="integrated" />} />
          </MenuItemLink>
        </MenuItem>
      )}

      {canShowDelete && (
        <MenuItem>
          <MenuItemLink className="p-0" onClick={onDeleteWorkspace}>
            <MenuItemLabel
              label={
                <Button
                  icon="box-archive"
                  label="Archive Workspace"
                  mode="integrated"
                  className="text-bosch-red hover:text-bosch-red"
                />
              }
            />
          </MenuItemLink>
        </MenuItem>
      )}
    </div>
  );
};

export default WorkspaceMenu;
