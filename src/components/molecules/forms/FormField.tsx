import { TextField } from '@bosch/react-frok';
import { ElementType, KeyboardEvent } from 'react';
import { Controller } from 'react-hook-form';

type FormFieldProps = {
  label?: string;
  name: string;
  control: any;
  placeholder?: string;
  type?: string;
  error?: any;
  className?: string;
  Component?: ElementType;
  rules?: Record<string, any>;
  options?: Array<{ value: string | number; label: string }>;
  disabled?: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
};

const FormField = ({
  label,
  name,
  control,
  placeholder,
  type,
  error,
  Component = TextField,
  rules,
  disabled,
  options,
  className,
  onKeyDown,
}: FormFieldProps) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, value, name } }) => (
        <div className="flex flex-col">
          <Component
            label={label}
            onChange={onChange}
            onKeyDown={onKeyDown}
            value={value}
            name={name}
            type={type}
            placeholder={placeholder}
            options={options}
            disabled={disabled}
            className={className}
          />
          {error?.message && <span className="mt-1 text-xs text-red-500">{error.message}</span>}
        </div>
      )}
    />
  );
};

export default FormField;
