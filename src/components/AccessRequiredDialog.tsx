import { useMsal } from '@azure/msal-react';
import { handleLogout } from '../services/auth.service';
import { Dialog } from '@bosch/react-frok';

interface AccessRequiredDialogProps {
  open?: boolean;
  onConfirm?: () => void;
}

const AccessRequiredDialog = ({ open = true, onConfirm }: AccessRequiredDialogProps) => {
  const { instance } = useMsal();
  const handleLogoutClick = async () => {
    try {
      handleLogout(instance);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white">
        <Dialog onConfirm={onConfirm || handleLogoutClick} title="Access Required">
          <div>
            <strong>You do not have access.</strong> Please request access from the administration by sending an email
            to <br />
            <a href="mailto:Indrasen.Raghupatruni@de.bosch.com" className="font-bold">
              Indrasen.Raghupatruni@de.bosch.com
            </a>{' '}
            <br />
            <br />
            <strong>Note:</strong> Our system includes 4 roles:{' '}
            <strong>Administrator, Solution Architect, System Architect and Tester</strong>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default AccessRequiredDialog;
