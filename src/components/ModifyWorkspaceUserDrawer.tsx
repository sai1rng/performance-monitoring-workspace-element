import { useState, useCallback, useMemo } from 'react';
import { Workspace, User } from 'src/types/workspace.type';
import { Button, Text } from '@bosch/react-frok';
import { UserSearchTab } from './UserSearchTab';

import { useUserAssignment } from '@hooks/useUserAssignment';
import { useUserSearch } from '@hooks/useUserSearch';
import useNotification from '@hooks/useNotification';
import { useDrawerStore } from '@stores/drawerStore';
import { User as LimitedSearchUser } from '@models/user.type';
import { useWorkspaceAssignees } from '@hooks/useWorkspaceAssignees';
import { useSaveWorkspaceMembers } from '@hooks/useSaveWorkspaceUsers';

interface ModifyWorkspaceUserDrawerProps {
  workspace: Workspace;
}

const convertSearchUserToUser = (searchUser: LimitedSearchUser): User => {
  const converted = {
    id: searchUser.email || searchUser.userId?.toString() || '',
    displayName: searchUser.displayedName || searchUser.name || '',
    userPrincipalName: searchUser.email || '',
    mail: searchUser.email || '',
    givenName: searchUser.displayedName || '',
    surname: searchUser.displayedName || '',
    displayedName: searchUser.displayedName || searchUser.name || '',
  };
  return converted;
};

const ModifyWorkspaceUserDrawer = ({ workspace }: ModifyWorkspaceUserDrawerProps) => {
  const notification = useNotification();
  const { closeDrawer } = useDrawerStore();

  const { assignees: newAssignees, currentAssignee, addAssignee, removeAssignee, selectUser } = useUserAssignment();

  const {
    userIdentifier,
    setUserIdentifier,
    debouncedUserIdentifier,
    searchQuery,
    clearSearch,
    usersData,
    isSearching,
  } = useUserSearch();

  const {
    isLoadingAssignees,
    existingAssignees,
    allAssignees,
    removedAssignees,
    handleRemoveAssignee,
    handleIsUserAssigned,
  } = useWorkspaceAssignees(workspace, newAssignees, removeAssignee);

  const convertedUsersData = useMemo(() => {
    if (!usersData || usersData.length === 0) return [];
    return usersData.map((searchUser: LimitedSearchUser) => convertSearchUserToUser(searchUser));
  }, [usersData]);

  const { saveUsers, isSaving } = useSaveWorkspaceMembers(workspace, removedAssignees, newAssignees);

  const handleUserSelect = useCallback(
    (user: User | undefined) => {
      selectUser(user);
      if (user) {
        setUserIdentifier(user.userPrincipalName);
      }
    },
    [selectUser, setUserIdentifier]
  );

  const handleSaveChanges = useCallback(async () => {
    try {
      await saveUsers();
      notification.success(`Workspace "${workspace.workspaceName}" users updated successfully!`);
      closeDrawer('modifyWorkspaceUsers');
    } catch (error: any) {
      notification.error(`Failed to update workspace users: ${error?.message || 'Unknown error'}`);
    }
  }, [saveUsers, notification, workspace.workspaceName, closeDrawer]);

  const handleCancel = useCallback(() => {
    closeDrawer('modifyWorkspaceUsers');
  }, [closeDrawer]);

  return (
    <div className="mt-4 flex flex-col gap-4">
      <Text>{workspace.workspaceName}</Text>

      <UserSearchTab
        userIdentifier={userIdentifier}
        setUserIdentifier={setUserIdentifier}
        debouncedUserIdentifier={debouncedUserIdentifier}
        currentAssignee={currentAssignee}
        searchQuery={{
          data: convertedUsersData,
          isLoading: isSearching,
          error: searchQuery.error || null,
          isError: searchQuery.isError || false,
          isSuccess: searchQuery.isSuccess || false,
        }}
        assignees={allAssignees}
        onUserSelect={handleUserSelect}
        onAssignUser={addAssignee}
        onRemoveAssignee={handleRemoveAssignee}
        isUserAssigned={handleIsUserAssigned}
        assignedUsersTitle="Remove assigned user(s)"
        showAssignedUsersCount={true}
        emptyAssignedUsersMessage="No members assigned to this workspace"
        isLoadingAssignees={isLoadingAssignees}
        newAssignees={newAssignees}
      />

      {isSaving && (
        <div className="flex h-40 items-center justify-center">
          <div className="flex items-center justify-center p-4">
            <div className="size-6 animate-spin rounded-full border-2 border-bosch-blue border-b-white"></div>
            <span className="ml-2 text-sm">Updating workspace members...</span>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-4">
        <Button mode="secondary" label="Cancel" onClick={handleCancel} disabled={isSaving} />
        <Button
          disabled={isSaving}
          onClick={handleSaveChanges}
          label={
            <div className="flex items-center justify-center gap-2">
              {isSaving && (
                <div className="size-4 animate-spin rounded-full border-2 border-bosch-blue border-b-white"></div>
              )}
              Update
            </div>
          }
        />
      </div>
    </div>
  );
};

export default ModifyWorkspaceUserDrawer;
