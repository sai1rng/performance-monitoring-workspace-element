import { Button, Dropdown, Text, TextField } from '@bosch/react-frok';
import useDebounce from '@hooks/useDebounce';
import useNotification from '@hooks/useNotification';
import { AzureUser } from '@models/user.type';
import { getRolesService } from '@services/role.service';
import { useCreateUser, useSearchUser } from '@services/user.query';
import { useQuery } from '@tanstack/react-query';
import React, { KeyboardEvent, RefObject, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import FormField from './FormField';

interface FormAddUserProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormAddUserValues {
  username: string;
  email: string;
  roleId: number;
}

const FormAddUser: React.FC<FormAddUserProps> = ({ onClose, onSuccess }) => {
  const notification = useNotification();
  const createUserMutation = useCreateUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const resultItemRefs = useRef<Record<number, RefObject<HTMLDivElement>>>({});
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError,
  } = useSearchUser(debouncedSearchTerm, debouncedSearchTerm.length >= 3);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: getRolesService,
    staleTime: 5 * 60 * 1000,
  });
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormAddUserValues>({
    defaultValues: {
      username: '',
      email: '',
      roleId: 1,
    },
    mode: 'onChange',
  });

  // Watch for username and email values to determine if button should be disabled
  const username = watch('username');
  const email = watch('email');

  useEffect(() => {
    if (roles && roles.length > 0) {
      const activeRoles = roles.filter((role) => role.isActive);
      if (activeRoles.length > 0) {
        setValue('roleId', activeRoles[0].id);
      }
    }
  }, [roles, setValue]);
  // Function to get or create a ref for a result item
  const getResultItemRef = (index: number) => {
    if (!resultItemRefs.current[index]) {
      resultItemRefs.current[index] = React.createRef<HTMLDivElement>();
    }
    return resultItemRefs.current[index];
  };

  // Reset selected index and clear refs when search results change
  useEffect(() => {
    setSelectedIndex(-1);
    resultItemRefs.current = {};
  }, [searchResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUserSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowResults(value.length >= 3);
  };
  // Effect to scroll selected item into view when selectedIndex changes
  useEffect(() => {
    if (selectedIndex >= 0 && resultItemRefs.current[selectedIndex]?.current) {
      resultItemRefs.current[selectedIndex].current?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || !searchResults || !Array.isArray(searchResults)) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prevIndex) => (prevIndex < searchResults.length - 1 ? prevIndex + 1 : prevIndex));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          selectSearchResult(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        break;
      default:
        break;
    }
  };

  const selectSearchResult = (user: AzureUser) => {
    const userName = user.displayName;
    const userMail = user.userPrincipalName || user.mail;
    if (userName && userMail) {
      setValue('username', userName);
      setValue('email', userMail);
    }

    setShowResults(false);
    setSearchTerm('');
  };

  const addUser = ({ username, email, roleId }: FormAddUserValues) => {
    createUserMutation.mutate(
      {
        displayedName: username,
        username,
        email,
        roleId,
      },
      {
        onSuccess: () => {
          onClose();
          notification.success('User added successfully');
          if (onSuccess) {
            onSuccess();
          }
        },
        onError: (error) => {
          notification.error(error?.response?.data?.message || 'Failed to add user');
        },
      }
    );
  };
  return (
    <form onSubmit={handleSubmit(addUser)} className="min-w-[600px] p-8">
      <h2 className="text-[24px] font-bold">Add New User</h2>
      <div className="my-8 space-y-8">
        <div className="relative">
          <TextField
            id="user-search"
            ref={searchInputRef}
            value={searchTerm}
            onChange={handleUserSearch}
            onKeyDown={handleKeyDown}
            placeholder="Search by name, email or NTID"
            className="w-full"
          />

          {!showResults && !searchTerm && (
            <Text className="mt-1 text-xs">Type at least 3 characters to search for users</Text>
          )}

          {showResults && debouncedSearchTerm.length >= 3 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
              {searchLoading ? (
                <div className="p-4 text-center text-sm">
                  <span className="mr-2">Searching users</span>
                  <span className="inline-block animate-pulse">...</span>
                </div>
              ) : searchError ? (
                <div className="p-4 text-center text-sm text-bosch-red">
                  {searchError instanceof Error && searchError.message.includes('Authentication')
                    ? 'Authentication error. Please refresh the page and try again.'
                    : 'Error searching users. Please try again.'}
                </div>
              ) : searchResults && Array.isArray(searchResults) && searchResults.length > 0 ? (
                <div
                  id="search-results-list"
                  ref={resultsRef}
                  className="max-h-60 overflow-auto py-1"
                  role="listbox"
                  aria-label="Search results"
                >
                  {(searchResults as AzureUser[]).map((user: AzureUser, index: number) => (
                    <div
                      key={user.id}
                      id={`search-result-${index}`}
                      ref={getResultItemRef(index)}
                      className={`cursor-pointer px-4 py-2 ${
                        selectedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => selectSearchResult(user)}
                      role="option"
                      data-selected={selectedIndex === index}
                      tabIndex={-1}
                    >
                      <div className="font-medium">{user.displayName || user.givenName}</div>
                      <div className="text-sm text-gray-500">{user.userPrincipalName || user.mail}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm">No users found</div>
              )}
            </div>
          )}
        </div>
        <FormField
          label="Name"
          name="username"
          type="text"
          placeholder="Name"
          disabled
          control={control}
          Component={TextField}
        />{' '}
        <FormField
          label="Email"
          name="email"
          placeholder="Email"
          type="email"
          disabled
          control={control}
          Component={TextField}
        />
        <FormField
          label="Role"
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
          label={createUserMutation.isPending ? 'Adding User...' : 'Add User'}
          disabled={
            rolesLoading || createUserMutation.isPending || Object.keys(errors).length > 0 || !username || !email
          }
          type="submit"
        />
        <Button label="Cancel" onClick={onClose} mode="secondary" />
      </div>
    </form>
  );
};

export default FormAddUser;
