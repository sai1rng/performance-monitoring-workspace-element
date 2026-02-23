import { ProgressIndicator } from '@bosch/react-frok';

interface ProgressWithMessageProps {
  message?: string;
}

const Progress = ({ message }: ProgressWithMessageProps) => {
  return (
    <div className="mt-2 space-x-2">
      <ProgressIndicator type="indeterminate" />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
};

export default Progress;
