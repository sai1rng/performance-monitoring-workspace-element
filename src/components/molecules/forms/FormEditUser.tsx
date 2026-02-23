import { Button, Dropdown, Text } from '@bosch/react-frok';
import useNotification from '@hooks/useNotification';
import { User } from '@models/user.type';
import { getRolesService } from '@services/role.service';
import { useUpdateUserRole } from '@services/user.query';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import FormField from './FormField';

interface FormEditUserProps {
  onClose: () => void;
  onSuccess?: () => void;
  user: User;
}

interface FormEditUserValues {
  roleId: number;
}

const FormEditUser: React.FC<FormEditUserProps> = ({ onClose, onSuccess, user }) => {
  const notification = useNotification();
  const updateUserRoleMutation = useUpdateUserRole();

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: getRolesService,
    staleTime: 5 * 60 * 1000,
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormEditUserValues>({
    defaultValues: {
      roleId: 0,
    },
    mode: 'onChange',
  });
  useEffect(() => {
    if (roles && roles.length > 0 && user.roles && user.roles.length > 0) {
      const userRoleName = user.roles[0].name;

      const matchingRole = roles.find((role) => role.name === userRoleName);
      if (matchingRole) {
        setValue('roleId', matchingRole.id);
      } else {
        // Fallback to first active role if no match found
        const activeRoles = roles.filter((role) => role.isActive);
        if (activeRoles.length > 0) {
          setValue('roleId', activeRoles[0].id);
        }
      }
    }
  }, [roles, user, setValue]);

  const updateUserRole = ({ roleId }: FormEditUserValues) => {
    if (!user.userId) {
      return;
    }

    updateUserRoleMutation.mutate(
      {
        userId: user.userId,
        roleIds: [roleId],
      },
      {
        onSuccess: () => {
          onClose();
          notification.success(`${user.displayedName || user.username}'s role was updated successfully`);
          if (onSuccess) {
            onSuccess();
          }
        },
        onError: (error) => {
          notification.error(error?.response?.data?.message || 'Failed to update user role');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(updateUserRole)} className="min-w-[500px] p-8">
      <h2 className="text-[24px] font-bold">Edit User Role</h2>

      <div className="my-8 space-y-6">
        <div className="mb-6">
          <Text className="mb-2 font-medium">User Information</Text>
          <div className="rounded bg-gray-50 p-4">
            <p className="font-medium">{user.displayedName || user.username}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="mt-2 text-xs text-gray-500">
              Current Role:
              {user.roles && user.roles.length > 0 ? user.roles[0]?.name : 'No role assigned'}
            </p>
          </div>
        </div>

        <FormField
          label="New Role"
          name="roleId"
          control={control}
          Component={Dropdown}
          options={
            roles
              ? roles
                  .filter((role) => role.isActive)
                  .map((role) => ({
                    value: role.id,
                    label: role.name,
                  }))
              : []
          }
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          label={updateUserRoleMutation.isPending ? 'Updating...' : 'Update Role'}
          disabled={rolesLoading || updateUserRoleMutation.isPending || Object.keys(errors).length > 0}
          type="submit"
        />
        <Button label="Cancel" onClick={onClose} mode="secondary" />
      </div>
    </form>
  );
};

export default FormEditUser;
