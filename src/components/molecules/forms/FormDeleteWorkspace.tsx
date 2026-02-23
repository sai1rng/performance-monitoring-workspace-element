import useNotification from '@hooks/useNotification';
import { useWorkspaceOptimisticUpdate } from '@hooks/useWorkspaceOptimisticUpdate';
import { useDeleteWorkspace } from '@services/workspace.query';
import { Workspace } from 'src/types/workspace.type';
import Dialog from '../dialogs/Dialog';

interface FormDeleteWorkspaceProps {
  workspace: Workspace;
  onCancel: () => void;
}

const FormDeleteWorkspace = ({ workspace, onCancel }: FormDeleteWorkspaceProps) => {
  const { mutate: deleteWorkspace, isPending: isDeletingWorkspace } = useDeleteWorkspace();
  const notification = useNotification();
  const { applyOptimisticDelete, revertOptimisticDelete, finalizeOptimisticDelete } = useWorkspaceOptimisticUpdate();

  const handleConfirmDelete = () => {
    const { previousData, queryKey } = applyOptimisticDelete(workspace.id);
    deleteWorkspace(workspace.id, {
      onSuccess: () => {
        finalizeOptimisticDelete(workspace.id);
        notification.success('Workspace deleted successfully.');
        onCancel();
      },
      onError: (error) => {
        revertOptimisticDelete(queryKey, previousData);
        notification.error(
          error?.response?.data?.errors?.[0]?.message ||
            error?.response?.data?.message ||
            'Failed to delete workspace. Please try again.'
        );
      },
    });
  };

  return (
    <Dialog
      title="Delete Workspace"
      confirmLabel="Yes, Delete"
      type="warn"
      onCancel={onCancel}
      onConfirm={handleConfirmDelete}
      isConfirming={isDeletingWorkspace}
    >
      This action cannot be undone. Are you sure you want to delete the workspace ‘{workspace.workspaceName}’?
    </Dialog>
  );
};
export default FormDeleteWorkspace;
