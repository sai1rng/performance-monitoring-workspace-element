import { Button, Dropdown, Text, TextArea, TextField } from '@bosch/react-frok';
import { Workspace } from 'src/types/workspace.type';
import FormField from './FormField';
import { useWorkspaceForm } from '@hooks/useWorkspaceForm';
import { useUpdateWorkspace } from '@services/workspace.query';
import useNotification from '@hooks/useNotification';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from 'src/types/common.type';

interface FormEditWorkspaceProps {
  workspace: Workspace;
  onCancelEditWorkspace: () => void;
}

const FormEditWorkspace = ({ workspace, onCancelEditWorkspace }: FormEditWorkspaceProps) => {
  const { mutateAsync: updateWorkspace, isPending: isUpdating } = useUpdateWorkspace();
  const notification = useNotification();
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useWorkspaceForm({
    compoundProducts: workspace.compoundProducts,
    defaultValues: {
      workspaceName: workspace.workspaceName,
      workspaceUrlLink: workspace.workspaceUrlLink,
      compoundProducts: workspace.compoundProducts[0].name,
      workspaceDescription: workspace.workspaceDescription,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const assigneeEmails = workspace.assignees?.map((assignee) => assignee.email) || [];

      await updateWorkspace({
        id: workspace.id,
        data: {
          workspaceName: data.workspaceName,
          workspaceUrlLink: data.workspaceUrlLink,
          workspaceDescription: data.workspaceDescription,
          assignees: assigneeEmails,
        },
      });
      onCancelEditWorkspace();
      notification.success('Workspace updated successfully.');
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      onCancelEditWorkspace();
      notification.error(
        axiosError?.response?.data?.errors?.[0]?.message ||
          axiosError?.response?.data?.message ||
          'Failed to update workspace. Please try again.'
      );
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col gap-4">
      <Text>{workspace.workspaceName}</Text>
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-1 flex-col gap-4">
          <FormField
            label="Name*"
            control={control}
            name="workspaceName"
            Component={TextField}
            error={errors.workspaceName}
          />
          <FormField
            label="Workspace URL*"
            control={control}
            name="workspaceUrlLink"
            Component={TextField}
            error={errors.workspaceUrlLink}
          />
          <FormField
            label="Compound Product Tag*"
            disabled
            control={control}
            name="compoundProducts"
            Component={Dropdown}
            options={
              workspace.compoundProducts?.map((cp) => ({
                label: cp.name,
                value: cp.id,
              })) || []
            }
          />
          <FormField label="Description" control={control} name="workspaceDescription" Component={TextArea} />
        </div>
        <div className="mt-auto flex justify-end gap-4 pt-4">
          <Button label="Cancel" onClick={onCancelEditWorkspace} mode="secondary" />
          <Button
            type="submit"
            mode="primary"
            label={
              <div className="flex items-center justify-center gap-2">
                {isUpdating && (
                  <div className="size-4 animate-spin rounded-full border-2 border-bosch-blue border-b-white"></div>
                )}
                Update
              </div>
            }
            disabled={!isDirty || isUpdating}
          />
        </div>
      </form>
    </div>
  );
};
export default FormEditWorkspace;
