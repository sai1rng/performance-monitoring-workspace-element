import { Button } from '@bosch/react-frok';
import { ReactNode } from 'react';

interface DialogProps {
  type?: 'info' | 'warn' | 'error';
  title?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const Dialog = ({
  type = 'info',
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isConfirming = false,
  onConfirm,
  onCancel,
}: DialogProps) => {
  const borderTopClasses = {
    info: 'border-t-4 border-t-bosch-blue',
    warn: 'border-t-4 border-t-bosch-yellow-85',
    error: 'border-t-4 border-t-bosch-red',
  };
  return (
    <div>
      <div className={`px-8 py-6 text-black lg:w-[620px] ${borderTopClasses[type]}`}>
        <div className="flex items-center justify-between">
          <p className="text-xl font-bold">{title}</p>
        </div>
        <div className="mb-6 mt-4">{children}</div>
        <div className="flex justify-end gap-4">
          <Button onClick={onCancel} mode="secondary">
            {cancelLabel}
          </Button>
          <Button
            disabled={isConfirming}
            onClick={onConfirm}
            label={
              <div className="flex items-center justify-center gap-2">
                {isConfirming && (
                  <div className="size-4 animate-spin rounded-full border-2 border-bosch-blue border-b-white"></div>
                )}
                {confirmLabel}
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};
export default Dialog;
