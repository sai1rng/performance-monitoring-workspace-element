import React, { useMemo } from 'react';
import { Chip } from '@bosch/react-frok';
import { User } from 'src/types/workspace.type';

interface AssignedUsersListProps {
  assignees: User[];
  onRemove: (userId: string) => void;
  title?: string;
  showCount?: boolean;
  emptyMessage?: string;
  isLoadingAssignees?: boolean;
  newAssignees?: User[];
}

const getUserKey = (user: User) => user.mail || user.userPrincipalName || user.id;

export const AssignedUsersList: React.FC<AssignedUsersListProps> = React.memo(
  ({
    assignees,
    onRemove,
    title = 'Remove assigned user(s)',
    showCount = true,
    emptyMessage = 'No users assigned yet',
    isLoadingAssignees,
    newAssignees,
  }) => {
    const displayTitle = showCount ? `${title} (${assignees.length})` : title;

    const newAssigneeKeys = useMemo(() => {
      if (!newAssignees || newAssignees.length === 0) return new Set<string>();
      return new Set(newAssignees.map((u) => getUserKey(u)));
    }, [newAssignees]);

    return (
      <div className="mt-8 flex flex-col">
        <p className="font-bold">{displayTitle}</p>

        {assignees.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            {isLoadingAssignees ? (
              <div className="flex items-center justify-center p-4">
                <div className="size-6 animate-spin rounded-full border-2 border-bosch-blue border-b-white"></div>
                <span className="ml-2 text-sm">Loading workspace members...</span>
              </div>
            ) : (
              <p>{emptyMessage}</p>
            )}
          </div>
        ) : (
          <div className="hp-40 mt-4 flex flex-col gap-4 overflow-y-auto">
            {assignees.map((user) => {
              const userKey = getUserKey(user);
              const isNew = newAssigneeKeys.has(userKey);

              return (
                <div key={user.id}>
                  <Chip
                    buttonClose
                    label={user.displayName}
                    onClose={() => onRemove(user.id)}
                    className={isNew ? 'bg-bosch-blue text-white' : ''}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

AssignedUsersList.displayName = 'AssignedUsersList';
