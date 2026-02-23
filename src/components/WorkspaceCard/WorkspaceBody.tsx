import { Chip, Text } from '@bosch/react-frok';
import { FC } from 'react';
import { Workspace } from 'src/types/workspace.type';

interface WorkspaceBodyProps {
  workspace: Workspace;
  isAdmin: boolean;
}

const WorkspaceBody: FC<WorkspaceBodyProps> = ({ workspace, isAdmin }) => {
  const getStatusChip = (provisionedCompoundProductCount: number, compoundProductProvisioningCount: number) => {
    return (
      <div>
        <Chip
          label={`${provisionedCompoundProductCount} Variants provisioned`}
          className="bg-bosch-green text-xs text-white"
        />
        {compoundProductProvisioningCount > 0 && (
          <Chip label="Provisioning updates in progress..." className="bg-bosch-gray-50 text-xs text-white" />
        )}
      </div>
    );
  };

  return (
    <div className="mt-3 flex flex-1 flex-col justify-between">
      <div>{getStatusChip(workspace.provisionedCompoundProductCount, workspace.compoundProductProvisioningCount)}</div>

      <div className="mt-4">
        <Text className="line-clamp-2">{workspace.workspaceDescription || 'No description available'}</Text>
      </div>

      <div className="mt-4 flex gap-4 py-5">
        <div className="min-w-40">
          <p className="font-bold">Total Tests Run</p>
          <p className="mt-2 text-2xl">0</p>
        </div>
        <div className="min-w-40">
          <p className="font-bold">Variants</p>
          <p className="mt-2 text-2xl">{workspace.compoundProducts?.[0]?.versions?.length || 0}</p>
        </div>
        {isAdmin && (
          <div className="min-w-40">
            <p className="font-bold">Assigned User(s)</p>
            <p className="mt-2 text-2xl">{workspace.assignees.length}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceBody;
