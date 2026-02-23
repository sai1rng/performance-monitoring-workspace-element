import React from 'react';

interface ToggleProps {
  /**
   * Unique ID for the toggle input
   */
  id: string;
  /**
   * The label to display next to the toggle
   */
  label?: string;
  /**
   * Whether the toggle is checked
   */
  checked: boolean;
  /**
   * Callback function when toggle state changes
   */
  onChange: (checked: boolean) => void;
  /**
   * Optional text to display on the left side of the toggle
   */
  leftLabel?: string;
  /**
   * Optional text to display on the right side of the toggle
   */
  rightLabel?: string;
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Whether the toggle is disabled
   */
  disabled?: boolean;
}

/**
 * Custom DaToggle component built from scratch without dependencies on @bosch/react-frok's Toggle.
 */
const Toggle: React.FC<ToggleProps> = ({
  id,
  label,
  className = '',
  checked,
  onChange,
  leftLabel,
  rightLabel,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}

      <div className="flex items-center">
        {leftLabel && <span className="mr-2 text-sm text-gray-500">{leftLabel}</span>}

        <div className="relative inline-block">
          <label htmlFor={id} className="sr-only">
            {label || leftLabel || rightLabel || 'Toggle'}
          </label>
          <input
            id={id}
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            title={label || leftLabel || rightLabel || 'Toggle'}
          />
          <div
            className={`relative h-6 w-12 rounded-full transition-colors duration-200 ease-in-out ${checked ? 'bg-primary' : 'bg-bosch-gray-60'} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} `}
            onClick={() => !disabled && onChange(!checked)}
          >
            <span
              className={`absolute left-0.5 top-0.5 flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-md transition duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'} `}
            />
          </div>
        </div>

        {rightLabel && <span className="ml-2 text-sm text-gray-500">{rightLabel}</span>}
      </div>
    </div>
  );
};

export default Toggle;
