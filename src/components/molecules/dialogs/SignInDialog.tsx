import FormSignIn from '../forms/FormSignIn';

interface SignInDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const SignInDialog = ({ isOpen = false, onClose = () => {} }: SignInDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white" onClick={(e) => e.stopPropagation()}>
        <FormSignIn setAuthType={() => {}} />
      </div>
    </div>
  );
};
export default SignInDialog;
