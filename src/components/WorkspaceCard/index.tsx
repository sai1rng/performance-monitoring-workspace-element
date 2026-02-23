import { FC, RefObject } from 'react';
import WorkspaceBody from './WorkspaceBody';
import WorkspaceFooter from './WorkspaceFooter';
import WorkspaceHeader from './WorkspaceHeader';
import { Workspace } from 'src/types/workspace.type';

interface WorkspaceCardProps {
  workspace: Workspace;
  isAdmin: boolean;
  activeWorkspaceMenu: string | number | null;
  menuRef: RefObject<HTMLDivElement>;
  onToggleMenu: (workspaceId: string | number) => void;
  onAssignUser: (workspace: Workspace) => void;
  onDeleteWorkspace: (workspace: Workspace) => void;
  onLaunchVariants: (workspace: Workspace, title?: string) => void;
}

const WorkspaceCard: FC<WorkspaceCardProps> = ({
  workspace,
  isAdmin,
  activeWorkspaceMenu,
  menuRef,
  onToggleMenu,
  onAssignUser,
  onDeleteWorkspace,
  onLaunchVariants,
}) => {
  return (
    <div className="flex flex-col bg-white px-6 py-4 text-black shadow-lg">
      <WorkspaceHeader
        workspace={workspace}
        isAdmin={isAdmin}
        activeWorkspaceMenu={activeWorkspaceMenu}
        onToggleMenu={onToggleMenu}
        onAssignUser={() => onAssignUser(workspace)}
        onDeleteWorkspace={() => onDeleteWorkspace(workspace)}
        menuRef={menuRef}
      />
      <WorkspaceBody workspace={workspace} isAdmin={isAdmin} />
      <WorkspaceFooter workspace={workspace} onLaunchVariants={onLaunchVariants} />
    </div>
  );
};

export default WorkspaceCard;
