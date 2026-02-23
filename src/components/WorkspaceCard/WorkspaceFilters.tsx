import { Dropdown } from '@bosch/react-frok';
import SearchTextField from '../atoms/SearchTextField';
import { FC } from 'react';

interface SearchAndActionsProps {
  searchInputValue: string;
  onSearchInputChange: (value: string) => void;
  onResetSearch: () => void;
  onPerformSearch: (term: string) => void;
}

const WorkspaceFilters: FC<SearchAndActionsProps> = ({
  searchInputValue,
  onSearchInputChange,
  onResetSearch,
  onPerformSearch,
}) => {
  return (
    <div className="flex items-center justify-between gap-10">
      <SearchTextField
        id="workspaceSearchField"
        placeholder="Search workspace name"
        value={searchInputValue}
        className="w-96"
        onChange={onSearchInputChange}
        onReset={onResetSearch}
        onSearch={onPerformSearch}
        title="Enter workspace name"
      />

      <div className="flex gap-4">
        <Dropdown className="w-72" label="OEM Partners" options={[{ value: 'all', label: 'All', name: 'All' }]} />
        <Dropdown className="w-72" label="Include Products" options={[{ value: 'all', label: 'All', name: 'All' }]} />
      </div>
    </div>
  );
};

export default WorkspaceFilters;
