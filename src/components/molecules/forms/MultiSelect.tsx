import React from 'react';
import { Text } from '@bosch/react-frok';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  id: string;
  name: string;
  label: string;
  value: string[];
  options: Option[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  error?: string;
  className?: string;
  height?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  id,
  name,
  label,
  value,
  options,
  onChange,
  required = false,
  error,
  className = '',
  height = 'h-32',
}) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label} {required && '*'}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        multiple
        required={required}
        className={`${height} w-full border bg-bosch-gray-90 p-3 text-black hover:bg-bosch-gray-80 ${
          error ? 'border-bosch-red-50' : 'border-bosch-gray-80'
        } p-2 focus:outline-none`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <Text className="mt-1 text-xs text-bosch-red-50">{error}</Text>
      ) : (
        <Text className="mt-1 text-xs text-bosch-gray-60">Hold Ctrl (or Cmd on Mac) to select multiple options</Text>
      )}
    </div>
  );
};

export default MultiSelect;
