import { TextField } from '@bosch/react-frok';
import React from 'react';

export interface SearchTextFieldProps {
  id: string;
  value: string;
  placeholder?: string;
  className?: string;
  title?: string;
  onChange: (value: string) => void;
  onReset: () => void;
  onSearch: (term: string) => void;
}

const SearchTextField: React.FC<SearchTextFieldProps> = ({
  id,
  value,
  placeholder = '',
  className,
  title,
  onChange,
  onReset,
  onSearch,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (v === '') {
      onReset();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(value);
    }
  };

  return (
    <TextField
      id={id}
      placeholder={placeholder}
      value={value}
      className={className}
      onChange={handleChange}
      resetButton={{
        title: 'Clear',
        onClick: onReset,
      }}
      searchButton={{
        title: 'Search',
        onClick: () => onSearch(value),
      }}
      onKeyDown={handleKeyDown}
      title={title}
      type="search"
    />
  );
};

export default SearchTextField;
