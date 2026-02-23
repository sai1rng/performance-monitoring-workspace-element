import React, { useMemo } from 'react';
import { Button, TextField } from '@bosch/react-frok';
import { UserSearchResults } from './UserSearchResults';
import { AssignedUsersList } from './AssignedUsersList';
import { User } from 'src/types/workspace.type';

interface UserSearchTabProps {
  userIdentifier: string;
  setUserIdentifier: (value: string) => void;
  debouncedUserIdentifier: string;
  currentAssignee?: User;
  searchQuery: any;
  assignees: User[];
  onUserSelect: (user: User | undefined) => void;
  onAssignUser: (user: User) => void;
  onRemoveAssignee: (userId: string) => void;
  isUserAssigned: (userId?: string) => boolean;
  assignedUsersTitle?: string;
  showAssignedUsersCount?: boolean;
  emptyAssignedUsersMessage?: string;
  isLoadingAssignees?: boolean;
  newAssignees?: User[];
}

export const UserSearchTab: React.FC<UserSearchTabProps> = React.memo(
  ({
    userIdentifier,
    setUserIdentifier,
    debouncedUserIdentifier,
    currentAssignee,
    searchQuery,
    assignees,
    onUserSelect,
    onAssignUser,
    onRemoveAssignee,
    isUserAssigned,
    assignedUsersTitle,
    showAssignedUsersCount = true,
    emptyAssignedUsersMessage,
    isLoadingAssignees,
    newAssignees,
  }) => {
    const canAssign = useMemo(
      () => currentAssignee && !isUserAssigned(currentAssignee.id),
      [currentAssignee, isUserAssigned]
    );

    return (
      <div>
        <p>Assign new user by searching Name or Email ID</p>
        <div className="mt-4 flex gap-6">
          <div className="relative flex-1">
            <TextField
              id="user-search"
              label="Full name/Email*"
              placeholder="Search Name/ Email"
              value={currentAssignee?.displayName || userIdentifier}
              onChange={(e) => setUserIdentifier(e.target.value)}
              onKeyDown={() => onUserSelect(undefined)}
            />
            <UserSearchResults
              userIdentifier={userIdentifier}
              debouncedUserIdentifier={debouncedUserIdentifier}
              currentAssignee={currentAssignee}
              searchQuery={searchQuery}
              onUserSelect={onUserSelect}
            />
          </div>
          <Button
            disabled={!canAssign}
            label="Assign"
            mode="secondary"
            onClick={() => {
              if (currentAssignee) {
                onAssignUser(currentAssignee);
                onUserSelect(undefined);
                setUserIdentifier('');
              }
            }}
          />
        </div>
        <AssignedUsersList
          assignees={assignees}
          onRemove={onRemoveAssignee}
          title={assignedUsersTitle}
          showCount={showAssignedUsersCount}
          emptyMessage={emptyAssignedUsersMessage}
          isLoadingAssignees={isLoadingAssignees}
          newAssignees={newAssignees}
        />
      </div>
    );
  }
);

UserSearchTab.displayName = 'UserSearchTab';
