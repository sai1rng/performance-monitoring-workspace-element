import React, { useState, useCallback, useMemo } from 'react';
import { Button, Icon, Tab, TabNavigation } from '@bosch/react-frok';
import { useCreateWorkspace } from '@services/workspace.query';
import { useCompoundProducts } from '@services/vew.query';
import useNotification from '@hooks/useNotification';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from 'src/types/common.type';
import { AddWorkspaceFormData, useWorkspaceForm } from '@hooks/useWorkspaceForm';
import { useUserAssignment } from '@hooks/useUserAssignment';
import { useUserSearch } from '@hooks/useUserSearch';
import { useWorkspaceOptimisticUpdate } from '@hooks/useWorkspaceOptimisticUpdate';
import { User } from 'src/types/workspace.type';
import { UserSearchTab } from '@components/UserSearchTab';
import { WorkspaceDetailsTab } from '@components/WorkspaceDetailsTab';
import { WORKSPACE_FORM_CONSTANTS } from '@constants/workspace.constants';
import { User as LimitedSearchUser } from '@models/user.type';

interface FormCreateWorkspaceProps {
  onCancel: () => void;
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

const FormCreateWorkspace: React.FC<FormCreateWorkspaceProps> = ({ onCancel }) => {
  const [currentTab, setCurrentTab] = useState<(typeof WORKSPACE_FORM_CONSTANTS.TABS)[number]>(
    WORKSPACE_FORM_CONSTANTS.TABS[0]
  );

  const { data: compoundProducts, isLoading: isLoadingCompoundProducts } = useCompoundProducts();
  const { mutate: createWorkspace, isPending: isCreatingWorkspace } = useCreateWorkspace();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useWorkspaceForm({ compoundProducts });
  const { assignees, currentAssignee, addAssignee, removeAssignee, isUserAssigned, selectUser } = useUserAssignment();

  const {
    userIdentifier,
    setUserIdentifier,
    debouncedUserIdentifier,
    searchQuery,
    clearSearch,
    usersData,
    isSearching,
  } = useUserSearch();

  const convertedUsersData = useMemo(() => {
    if (!usersData || usersData.length === 0) return [];
    return usersData.map((searchUser: LimitedSearchUser) => convertSearchUserToUser(searchUser));
  }, [usersData]);

  const { applyOptimisticUpdate, revertOptimisticUpdate, finalizeOptimisticUpdate } = useWorkspaceOptimisticUpdate();

  const notification = useNotification();

  const createWorkspacePayload = useCallback(
    (data: AddWorkspaceFormData) => ({
      ...data,
      compoundProducts:
        compoundProducts?.compoundProducts
          .filter((product) => product.id === data.compoundProducts)
          .map((product) => ({ id: product.id, name: product.name })) || [],
      assignees: assignees.map((user) => user.userPrincipalName),
      projectId: import.meta.env.PROJECT_ID || WORKSPACE_FORM_CONSTANTS.DEFAULT_PROJECT_ID,
    }),
    [compoundProducts, assignees]
  );

  const handleCreateWorkspace = useCallback(
    (data: AddWorkspaceFormData) => {
      const workspacePayload = createWorkspacePayload(data);
      const { previousData, queryKey } = applyOptimisticUpdate(workspacePayload);

      createWorkspace(workspacePayload, {
        onSuccess: (newWorkspace) => {
          finalizeOptimisticUpdate(queryKey, newWorkspace);
          notification.success('Workspace created successfully.');
          onCancel();
        },
        onError: (error: AxiosError<ApiErrorResponse>) => {
          revertOptimisticUpdate(queryKey, previousData);
          notification.error(
            error?.response?.data?.errors?.[0]?.message ||
              error?.response?.data?.message ||
              'Failed to create workspace. Please try again.'
          );
        },
      });
    },
    [
      createWorkspacePayload,
      applyOptimisticUpdate,
      createWorkspace,
      finalizeOptimisticUpdate,
      revertOptimisticUpdate,
      notification,
      onCancel,
    ]
  );

  const handleUserSelect = useCallback(
    (user: User | undefined) => {
      selectUser(user);
      if (user) {
        setUserIdentifier(user.userPrincipalName);
      }
    },
    [selectUser, setUserIdentifier]
  );

  const renderTabContent = () => {
    if (currentTab.value === 'details') {
      return (
        <WorkspaceDetailsTab
          control={control}
          errors={errors}
          compoundProducts={compoundProducts}
          isLoadingCompoundProducts={isLoadingCompoundProducts}
        />
      );
    }

    if (currentTab.value === 'users') {
      return (
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
          assignees={assignees}
          onUserSelect={handleUserSelect}
          onAssignUser={addAssignee}
          onRemoveAssignee={removeAssignee}
          isUserAssigned={isUserAssigned}
        />
      );
    }

    return null;
  };

  return (
    <form onSubmit={handleSubmit(handleCreateWorkspace)} className="min-w-[620px] px-8 py-6 text-black">
      <div className="flex justify-between">
        <p className="text-2xl font-bold">Add New Workspace</p>
        <Icon iconName="close" className="cursor-pointer font-bold hover:text-bosch-blue" onClick={onCancel} />
      </div>

      <div>
        <TabNavigation as="div" defaultSelectedValue={currentTab.value}>
          {WORKSPACE_FORM_CONSTANTS.TABS.map((tab) => (
            <Tab key={tab.value} value={tab.value} onClick={() => setCurrentTab(tab)}>
              {tab.label}
            </Tab>
          ))}
        </TabNavigation>
      </div>

      <div className="min-h-80">{renderTabContent()}</div>

      <div className="mt-8 flex justify-end gap-4">
        <Button mode="secondary" label="Cancel" onClick={onCancel} />
        <Button
          disabled={isCreatingWorkspace}
          onClick={handleSubmit(handleCreateWorkspace)}
          label={
            <div className="flex items-center justify-center gap-2">
              {isCreatingWorkspace && (
                <div className="size-4 animate-spin rounded-full border-2 border-bosch-blue border-b-white"></div>
              )}
              Add Workspace
            </div>
          }
        />
      </div>
    </form>
  );
};

export default FormCreateWorkspace;
