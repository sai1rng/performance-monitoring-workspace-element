import Dialog from './Dialog';
import {
  useProvisionCompoundProduct,
  useTerminateProvisionedCompoundProduct,
  useStartProvisionedCompoundProduct,
  useStopProvisionedCompoundProduct,
} from '@services/vew.query';
import { Workspace } from 'src/types/workspace.type';
import {
  PROVISIONING_DIALOG_TYPES,
  PROVISIONING_POLLING_CONSTANTS,
  ProvisioningDialogType,
  WORKSPACE_FORM_CONSTANTS,
} from '@constants/workspace.constants';
import useNotification from '@hooks/useNotification';
import useModalStore from '@hooks/useModalStore';
import useDrawerStoreHook from '@hooks/useDrawerStore';
import { CompoundProductVersionStatues } from 'src/types/vew.type';
import useProvisioningStore from '@stores/provisioningStore';
import { useQueryClient } from '@tanstack/react-query';
import { decrementProvisionedCount } from '@utils/common';

interface ProvisioningDialogProps {
  variant: CompoundProductVersionStatues;
  workspace: Workspace;
  type: ProvisioningDialogType;
  modalName: string;
  setSelectedVariant: (variant: CompoundProductVersionStatues | null) => void;
}

interface DialogConfig {
  title: string;
  confirmLabel: string;
  message: string;
  type?: 'warn';
}

const DIALOG_CONFIGS: Record<ProvisioningDialogType, DialogConfig> = {
  [PROVISIONING_DIALOG_TYPES.PROVISION]: {
    title: 'Start Provisioning',
    confirmLabel: 'Yes, start',
    message: "Start provisioning '{variant}'? This may take a while.",
  },
  [PROVISIONING_DIALOG_TYPES.TERMINATE]: {
    title: 'Stop Provisioning',
    confirmLabel: 'Yes, stop',
    message: "All progress will be lost. Are you sure you want to stop provisioning '{variant}'?",
    type: 'warn',
  },
  [PROVISIONING_DIALOG_TYPES.START]: {
    title: 'Start Variant',
    confirmLabel: 'Confirm',
    message: "Start variant '{variant}'? This may take a while.",
  },
  [PROVISIONING_DIALOG_TYPES.STOP]: {
    title: 'Stop Variant',
    confirmLabel: 'Confirm',
    message: "Are you sure you want to stop variant '{variant}'?",
    type: 'warn',
  },
};

const ProvisioningDialog = ({ variant, workspace, type, modalName, setSelectedVariant }: ProvisioningDialogProps) => {
  const notification = useNotification();
  const { closeAllModals, closeModal } = useModalStore();
  const { closeAllDrawers } = useDrawerStoreHook();
  const queryClient = useQueryClient();

  const { mutate: provision, isPending: isProvisioning } = useProvisionCompoundProduct();
  const { mutate: terminate, isPending: isTerminating } = useTerminateProvisionedCompoundProduct();
  const { mutate: start, isPending: isStarting } = useStartProvisionedCompoundProduct();
  const { mutate: stop, isPending: isStopping } = useStopProvisionedCompoundProduct();

  const { startProvisioning, addProvisionedCompoundProduct } = useProvisioningStore();
  const projectId = import.meta.env.PROJECT_ID || WORKSPACE_FORM_CONSTANTS.DEFAULT_PROJECT_ID;

  const isPending = isProvisioning || isTerminating || isStarting || isStopping;

  const handleClose = () => {
    closeModal(modalName);
    setSelectedVariant(null);
  };

  const handleConfirm = () => {
    const handlers: Record<ProvisioningDialogType, () => void> = {
      [PROVISIONING_DIALOG_TYPES.PROVISION]: () =>
        provision(
          {
            projectId,
            workspaceId: workspace?.id,
            compoundProductData: {
              compoundProductId: workspace.compoundProducts?.[0]?.id,
              compoundProductVersionId: variant?.variantId,
              stage: 'dev',
              deploymentOption: 'SINGLE_AZ',
            },
          },
          {
            onSuccess: () => {
              notification.neutral(
                `Start provisioning for '${workspace.workspaceName}' is in progress. You will be notified once updates are complete.`
              );
              startProvisioning(workspace.id);
              closeAllDrawers();
              closeAllModals();
              setSelectedVariant(null);
            },
            onError: (error) => {
              notification.error(
                error?.message || `Failed to start provisioning for '${workspace.workspaceName}'. Please try again.`
              );
            },
          }
        ),

      [PROVISIONING_DIALOG_TYPES.TERMINATE]: () =>
        terminate(
          {
            projectId,
            provisionedCompoundProductId: variant.provisionedCompoundProductId!,
          },
          {
            onSuccess: () => {
              notification.success(`Deprovisioning completed successfully for '${workspace.workspaceName}'`);
              queryClient.setQueriesData(
                {
                  queryKey: [PROVISIONING_POLLING_CONSTANTS.QUERY_KEYS.WORKSPACES[0]],
                },
                (oldData: any) => decrementProvisionedCount(oldData, workspace.id)
              );
              closeAllDrawers();
              closeAllModals();
              setSelectedVariant(null);
            },
            onError: (error) => {
              notification.error(
                error?.message || `Failed to deprovision '${workspace.workspaceName}'. Please try again.`
              );
            },
          }
        ),

      [PROVISIONING_DIALOG_TYPES.START]: () =>
        start(
          {
            projectId,
            provisionedCompoundProductId: variant.provisionedCompoundProductId!,
          },
          {
            onSuccess: () => {
              notification.neutral(
                `Starting for '${workspace.workspaceName}' is in progress. You will be notified once updates are complete.`
              );
              addProvisionedCompoundProduct(
                variant.provisionedCompoundProductId!,
                workspace.id,
                workspace.workspaceName
              );
              closeAllDrawers();
              closeAllModals();
              setSelectedVariant(null);
            },
            onError: (error) => {
              notification.error(error?.message || `Failed to start '${workspace.workspaceName}'. Please try again.`);
            },
          }
        ),

      [PROVISIONING_DIALOG_TYPES.STOP]: () =>
        stop(
          {
            projectId,
            provisionedCompoundProductId: variant.provisionedCompoundProductId!,
          },
          {
            onSuccess: () => {
              notification.neutral(
                `Stopping for '${workspace.workspaceName}' is in progress. You will be notified once updates are complete.`
              );
              addProvisionedCompoundProduct(
                variant.provisionedCompoundProductId!,
                workspace.id,
                workspace.workspaceName
              );
              closeAllDrawers();
              closeAllModals();
              setSelectedVariant(null);
            },
            onError: (error) => {
              notification.error(error?.message || `Failed to stop '${workspace.workspaceName}'. Please try again.`);
            },
          }
        ),
    };

    handlers[type]?.();
  };

  const config = DIALOG_CONFIGS[type];
  const message = config.message.replace('{variant}', variant.variantName);

  return (
    <Dialog
      title={config.title}
      confirmLabel={config.confirmLabel}
      type={config.type}
      isConfirming={isPending}
      onConfirm={handleConfirm}
      onCancel={handleClose}
    >
      {message}
    </Dialog>
  );
};

export default ProvisioningDialog;
