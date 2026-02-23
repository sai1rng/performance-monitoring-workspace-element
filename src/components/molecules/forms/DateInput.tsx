import React from 'react';

interface DateInputProps {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  label: string;
  name: string;
}

const DateInput: React.FC<DateInputProps> = ({ value, onChange, label, name }) => {
  return (
    <div className="flex flex-col">
      <label htmlFor={name} className="mb-1 text-sm font-medium">
        {label}
      </label>
      <input
        id="fromDate"
        type="date"
        value={value}
        onChange={onChange}
        className="bg-bosch-gray-90 p-3 text-black hover:bg-bosch-gray-80"
        placeholder={label}
        title={label}
      />
    </div>
  );
};
export default DateInput;
