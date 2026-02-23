import React from 'react';
import { Text, Table, TableBody, TableRow, TableCell, TableHead } from '@bosch/react-frok';
import UserTableRow from './UserTableRow';
import { Assignee, Workspace } from 'src/types/workspace.type';

interface WorkspaceUsersTabProps {
  workspace: Workspace;
}

const WorkspaceUsersTab: React.FC<WorkspaceUsersTabProps> = ({
  workspace,
}) => {
  const getUserTableRows = () => {
    if (workspace.assignees && workspace.assignees.length > 0) {
      return workspace.assignees.map((assignee: Assignee, index: number) => (
        <UserTableRow
          key={`user-${index}-${assignee.email}`}
          assignee={assignee}
          index={index}
        />
      ));
    }

    return (
      <TableRow key="no-users">
        <TableCell colSpan={3}>
          <Text>No users assigned</Text>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell header>
            NT-ID
          </TableCell>
          <TableCell header>
            Full Name
          </TableCell>
          <TableCell header>
            Status
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {getUserTableRows()}
      </TableBody>
    </Table>
  );
};

export default WorkspaceUsersTab;
