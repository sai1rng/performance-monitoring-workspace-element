import React from 'react';
import { Button } from '@bosch/react-frok';
import { User } from 'src/types/workspace.type';

interface UserSearchResultsProps {
  userIdentifier: string;
  debouncedUserIdentifier: string;
  currentAssignee?: User;
  searchQuery: {
    data?: User[];
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
  };
  onUserSelect: (user: User) => void;
}

export const UserSearchResults: React.FC<UserSearchResultsProps> = React.memo(
  ({ userIdentifier, debouncedUserIdentifier, currentAssignee, searchQuery, onUserSelect }) => {
    if (currentAssignee || debouncedUserIdentifier.length < 3 || userIdentifier.length == 0) {
      return null;
    }

    const { data: searchResults = [], isLoading, isError, isSuccess } = searchQuery;

    return (
      <div className="absolute z-10 max-h-60 w-full overflow-y-auto border border-gray-300 bg-white shadow-lg">
        {isLoading && (
          <div className="p-3 text-center text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="size-4 animate-spin rounded-full border-2 border-bosch-blue border-b-white"></div>
              Searching...
            </div>
          </div>
        )}

        {isError && <div className="p-3 text-center text-red-500">Error searching users. Please try again.</div>}

        {isSuccess && searchResults.length > 0 && (
          <div>
            {searchResults.map((user) => (
              <Button
                as="div"
                mode="integrated"
                key={user.id}
                onClick={() => onUserSelect(user)}
                label={
                  <>
                    <p>{user.displayName}</p>
                    <p className="text-sm text-bosch-gray-55">{user.userPrincipalName}</p>
                  </>
                }
              />
            ))}
          </div>
        )}

        {isSuccess && searchResults.length === 0 && (
          <div className="p-3 text-center text-gray-500">No users found for "{debouncedUserIdentifier}"</div>
        )}
      </div>
    );
  }
);

UserSearchResults.displayName = 'UserSearchResults';
