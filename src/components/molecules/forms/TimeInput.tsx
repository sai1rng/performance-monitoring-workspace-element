import React from 'react';

interface TimeInputProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * A time input component for selecting times in 24-hour format
 */
const DaTimeInput: React.FC<TimeInputProps> = ({
  id,
  value,
  onChange,
  disabled = false,
  className = '',
  ariaLabel,
}) => {
  return (
    <div className="flex items-center">
      <input
        type="time"
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`bg-bosch-gray-90 p-3 text-black hover:bg-bosch-gray-80 ${className}`}
        aria-label={ariaLabel}
      />
    </div>
  );
};

export default DaTimeInput;
