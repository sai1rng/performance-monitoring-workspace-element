import React from "react";
import { Text, TableRow, TableCell } from "@bosch/react-frok";
import { USER_DATA_NOT_AVAILABLE } from "@constants/Constant";
import { Assignee } from "src/types/workspace.type";
import UserStatusIndicator from "@components/UserStatusIndicator";

interface UserTableRowProps {
  assignee: Assignee;
  index: number;
}

const UserTableRow: React.FC<UserTableRowProps> = ({ assignee, index }) => {
  const extractNtidFromEmail = (email: string): string => {
    if (!email) return USER_DATA_NOT_AVAILABLE;
    if (email.indexOf('@') === -1) return email;
    return email.substring(0, email.indexOf('@')).toUpperCase();
  };

  const id = extractNtidFromEmail(assignee.email);
  const fullName = assignee.fullname || USER_DATA_NOT_AVAILABLE;

    return (
        <TableRow key={`user-${index}-${assignee.email}`}>
            <TableCell>
                <Text>{id}</Text>
            </TableCell>
            <TableCell>
                <Text>{fullName}</Text>
            </TableCell>
            <TableCell>
                <UserStatusIndicator 
                    isOnline={assignee.isOnline || false}
                    size="medium"
                />
            </TableCell>
        </TableRow>
    );
};

export default UserTableRow;
