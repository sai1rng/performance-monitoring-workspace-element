import React, { useEffect, useState } from 'react';
import { Button, Dialog, Text } from '@bosch/react-frok';
import useNotification from '@hooks/useNotification';
import { User } from '@models/user.type';
import { useLimitedUsers } from '@services/user.query';
import { useUpdateWorkspace } from '@services/workspace.query';
import useModalStore from '@hooks/useModalStore';
import AssignUserMultiSelect from './AssignUserMultiSelect';
import Modal from '@components/Modal';
import { Assignee } from 'src/types/workspace.type';

interface FormAssignUserProps {
  workspace: any;
}

const LIMIT_USER_SEARCH = 5;

const CONFIRM_ASSIGN_USER_MODAL_ID = 'confirmAssignUserModal';

const FormAssignUser: React.FC<FormAssignUserProps> = ({ workspace }) => {
  const notification = useNotification();
  const openModal = useModalStore((state) => state.openModal);
  const closeModal = useModalStore((state) => state.closeModal);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [addingUsers, setAddingUsers] = useState<User[]>([]);
  const [removingUsers, setRemovingUsers] = useState<User[]>([]);

  // Get the update workspace mutation
  const updateWorkspaceMutation = useUpdateWorkspace();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // User search functionality - improved matching UserManagementPage approach
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userPage, setUserPage] = useState(0);

  // Using useLimitedUsers hook for user search
  const { data: usersLimitedData, isLoading: searchLoading } = useLimitedUsers({
    page: userPage,
    size: 20,
    searchTerm: userSearchTerm,
    limit: LIMIT_USER_SEARCH,
  });

  useEffect(() => {
    if (!workspace?.assignees?.length) return;

    const preAssignedUsers = workspace.assignees;

    setAssignedUsers((prev) => {
      const merged = [...prev];
      preAssignedUsers.forEach((assignee: Assignee) => {
        if (!merged.some((u) => u.email === assignee?.email)) {
          const user = { displayedName: assignee.fullname, email: assignee.email };
          merged.push(user as User);
        }
      });
      return merged;
    });
  }, [workspace]);

  // Track parameters for each product item
  const [productIdToFetch, setProductIdToFetch] = useState<string | null>(null);

  // Helper function specifically for auto-selecting the first product
  const handleFirstProductSelection = (productId: string) => {
    if (!productId || productId.trim() === '') {
      return;
    }

    // Wait for any existing fetch operation to complete
    if (productIdToFetch) {
      setTimeout(() => handleFirstProductSelection(productId), 200);
      return;
    }

    setProductIdToFetch(productId);
  };

  const handleOpenConfirmModal = () => {
    if (assignedUsers.length === 0 && addingUsers.length === 0) {
      setFormErrors((prev) => ({
        ...prev,
        assignUsers: 'At least one user must be assigned. Please select a user.',
      }));
      return;
    }

    openModal(
      CONFIRM_ASSIGN_USER_MODAL_ID,
      <Dialog
        title="Confirm assign user"
        confirmLabel={'Confirm'}
        variant="info"
        onConfirm={onSubmit}
        onCancel={() => closeModal(CONFIRM_ASSIGN_USER_MODAL_ID)}
      >
        <p className="leading-relaxed text-gray-700">
          Do you really want to save the new assignment? Your changes will not be reverted. <br />
          Please check carefully again on your changes below:
        </p>

        <div className="mt-4">
          <strong>Current workspace name: {workspace.workspaceName}.</strong>
        </div>

        <div className="mt-4">
          <b className="mb-2 block">New user(s) will be assigned:</b>
          <ul className="list-inside list-disc space-y-1">
            {addingUsers.length > 0 ? (
              addingUsers.map((user) => (
                <li key={user.email} className="leading-snug">
                  {user.displayedName ?? user.name}
                </li>
              ))
            ) : (
              <li className="italic text-gray-500">(No any asignees)</li>
            )}
          </ul>
        </div>

        <div className="mt-4">
          <b className="mb-2 block">User(s) will be removed from current assignment:</b>
          <ul className="list-inside list-disc space-y-1">
            {removingUsers.length > 0 ? (
              removingUsers.map((user) => (
                <li key={user.email} className="leading-snug">
                  {user.displayedName ?? user.name}
                </li>
              ))
            ) : (
              <li className="italic text-gray-500">(No any asignees)</li>
            )}
          </ul>
        </div>
      </Dialog>
    );
  };

  // Handle form submission
  const onSubmit = () => {
    // Form validation
    const errors: Record<string, string> = {};

    // Validate user assignments
    if (assignedUsers.length === 0 && addingUsers.length === 0) {
      errors.assignUsers = 'At least one user must be assigned';
    }

    // Update errors state
    setFormErrors(errors);

    // If there are errors, don't proceed with submission
    if (Object.keys(errors).length > 0) {
      return;
    }

    const emailAssignees: string[] = [...assignedUsers, ...addingUsers].map((user) => user?.email || '');

    // Use the mutation to assign user via VEW API
    setIsAssigning(true);
    // Call the update mutation with the workspace id and updated data
    const requestData: any = {
      workspaceName: workspace.workspaceName || '',
      workspaceDescription: workspace.workspaceDescription || '',
      workspaceUrlLink: workspace.workspaceUrlLink || '',
      products: workspace.products?.length
        ? workspace.products.map((product: any, index: number) => ({
            id: index + 1,
            productId: product.productId || '',
            parameters: product.parameters || [],
          }))
        : [{ id: 1, productId: '', parameters: [] }],
      assignees: emailAssignees,
    };
    updateWorkspaceMutation.mutate(
      {
        id: workspace.id,
        data: requestData,
      },
      {
        onSuccess: () => {
          setIsAssigning(false);
          notification.success(`Assign user for workspace "${workspace.workspaceName}" successfully!`);
          closeModal('assignUserModal');
        },
        onError: (error) => {
          setIsAssigning(false);
          notification.error(`Failed to assign user: ${error.message || 'Unknown error'}`);
        },
      }
    );
    closeModal(CONFIRM_ASSIGN_USER_MODAL_ID);
  };

  const onCancel = () => {
    closeModal('assignUserModal');
  };

  // Reset user search state
  const resetUserSearch = () => {
    setUserSearchTerm('');
    setUserPage(0);
  };

  // Perform user search
  const performUserSearch = (term: string) => {
    setUserSearchTerm(term);
    setUserPage(0);
  };

  // Handle user search input change
  const handleUserSearch = (term: string) => {
    // Clear search when input is empty
    if (term === '') {
      resetUserSearch();
    }
  };

  // Add a user to the assigned users list
  const handleAddUserFromSearch = (email: string, displayedName: string) => {
    const userToAdd = { email, displayedName } as User;
    if (
      userToAdd &&
      !assignedUsers.some((user) => user.email?.toString() === email) &&
      !addingUsers.some((user) => user.email?.toString() === email) &&
      !removingUsers.some((user) => user.email?.toString() === email)
    ) {
      setAddingUsers([...addingUsers, userToAdd]);
      setRemovingUsers((prev) => prev.filter((u) => u.email?.toString() !== email));
    } else {
      notification.warning('User already exists in the added, current or removed lists. Please check again.');
    }
    // Clear any error for the assignUsers field if it exists
    if (formErrors.assignUsers) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated.assignUsers;
        return updated;
      });
    }
  };

  // Remove a user from the assigned users list
  const handleRemoveUserCurrent = (userId: string) => {
    // find the user
    const user = assignedUsers.find((u) => u.email?.toString() === userId);
    if (!user) return;

    // remove from current list
    setAssignedUsers((prev) => prev.filter((u) => u.email?.toString() !== userId));

    // add to removed list
    setRemovingUsers((prev) => [...prev, user]);
  };

  // Remove a user from the assigned users list
  const handleRemoveUserAdding = (userId: string) => {
    const updatedUsers = addingUsers.filter((user) => user.email?.toString() !== userId);
    setAddingUsers(updatedUsers);
  };

  // Remove a user from the assigned users list
  const handleRestoreUserRemoved = (userId: string) => {
    // find the user
    const user = removingUsers.find((u) => u.email?.toString() === userId);
    if (!user) return;

    // remove from current list
    setRemovingUsers((prev) => prev.filter((u) => u.email?.toString() !== userId));

    // restore to current list
    setAssignedUsers((prev) => [...prev, user]);
  };

  return (
    <Dialog
      title={`Assign User for workspace "${workspace.workspaceName}"`}
      confirmButton={
        <Button disabled={isAssigning}>
          <div className="flex items-center justify-center gap-2">
            {isAssigning ? (
              <>
                <div className="size-4 animate-spin rounded-full border-2 border-bosch-blue border-b-white" /> Saving...
              </>
            ) : (
              'Confirm'
            )}
          </div>
        </Button>
      }
      variant="info"
      onConfirm={() => handleOpenConfirmModal()}
      onCancel={!isAssigning ? onCancel : undefined}
    >
      <div className="w-full space-y-6 md:w-[700px] md:min-w-[700px]">
        <div className="space-y-4">
          <div>
            <AssignUserMultiSelect
              id="assignUsers"
              label="Search and Assign Users to Workspace"
              placeholder="Search users by name or email"
              selectedValues={assignedUsers.map((user) => user.email?.toString() || '')}
              addedValues={addingUsers.map((user) => user.email?.toString() || '')}
              removedValues={removingUsers.map((user) => user.email?.toString() || '')}
              onSelect={handleAddUserFromSearch}
              onRemoveUserCurrent={handleRemoveUserCurrent}
              onRemoveUserAdding={handleRemoveUserAdding}
              onRestoreUserRemoved={handleRestoreUserRemoved}
              searchResults={usersLimitedData?.content || []}
              isSearching={searchLoading}
              onSearch={handleUserSearch}
              onSearchSubmit={performUserSearch}
              onSearchReset={resetUserSearch}
              useExplicitSearch={true}
              getOptionLabel={(user) => user.displayedName || user.name || user.username || ''}
              getOptionValue={(user) => user.email?.toString() || ''}
              getOptionDescription={(user) => user.email || user.userPrincipalName || user.mail || ''}
              getSelectedCurrentUserLabel={(userId) => {
                const user = assignedUsers.find((u) => u.email?.toString() === userId);
                return user ? user.displayedName || user.username || user.name || userId : userId;
              }}
              getSelectedAddingUserLabel={(userId) => {
                const user = addingUsers.find((u) => u.email?.toString() === userId);
                return user ? user.displayedName || user.username || user.name || userId : userId;
              }}
              getSelectedRemovingUserLabel={(userId) => {
                const user = removingUsers.find((u) => u.email?.toString() === userId);
                return user ? user.displayedName || user.username || user.name || userId : userId;
              }}
              minSearchLength={3}
              noResultsMessage="No users found"
              searchingMessage="Searching users..."
            />
            {formErrors.assignUsers && <Text className="mt-1 text-sm text-bosch-red">{formErrors.assignUsers}</Text>}
          </div>
        </div>
        <Modal modalName={CONFIRM_ASSIGN_USER_MODAL_ID} />
      </div>
    </Dialog>
  );
};

export default FormAssignUser;
