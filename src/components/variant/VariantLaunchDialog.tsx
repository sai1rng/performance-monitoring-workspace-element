import { Button, Dialog, Dropdown } from '@bosch/react-frok';
import { DIALOG_CONFIG } from '@constants/variant.constants';
import { useDialogButtons, useVariantLaunch } from '@hooks/useVariantLaunchDialog';
import React from 'react';
import { Workspace } from 'src/types/workspace.type';
import VariantLoadingIndicator from './VariantLoadingIndicator';
import VariantStatusIndicatorWithLabel from './VariantStatusIndicatorWithLabel';

interface VariantLaunchDialogProps {
  onCancel: () => void;
  onLaunch?: (workspaceId: string, variantId: string) => void;
  workspace: Workspace;
  title?: string;
}

const VariantLaunchDialog: React.FC<VariantLaunchDialogProps> = ({ onCancel, onLaunch, workspace, title }) => {
  const {
    selectedVariant,
    formErrors,
    isProvisioning,
    isLoadingVariants,

    variantOptions,
    variantsError,
    currentVariantStatus,
    shouldShowProvisioning,

    handleVariantChange,
    handleLaunch,
    handleCancel,
    refetchVariants,
  } = useVariantLaunch(workspace, onLaunch, onCancel);

  const { launchButtonProps, cancelButtonProps } = useDialogButtons({
    isProvisioning,
    isLoadingVariants,
    shouldShowProvisioning,
    handleLaunch,
    handleCancel,
  });

  return (
    <Dialog
      cancelButton={<Button {...launchButtonProps} />}
      confirmButton={<Button {...cancelButtonProps} />}
      onClose={handleCancel}
      title={title ? title : DIALOG_CONFIG.title}
    >
      <div className={`${DIALOG_CONFIG.minWidth} space-y-4`}>
        <div className="flex items-center justify-between">
          <div>{workspace.workspaceName}</div>
        </div>

        <div>
          <Dropdown
            label={DIALOG_CONFIG.variantDropdownLabel}
            options={variantOptions}
            value={selectedVariant}
            onChange={handleVariantChange}
            disabled={isLoadingVariants || isProvisioning}
          />

          {formErrors.variant && <div className="mt-1 text-sm text-red-500">{formErrors.variant}</div>}

          {variantsError && (
            <div className="mt-1 text-sm text-red-500">
              Failed to load variants.
              <button type="button" onClick={() => refetchVariants()} className="ml-1 underline hover:no-underline">
                Retry
              </button>
            </div>
          )}

          <VariantLoadingIndicator isLoadingVariants={isLoadingVariants} isProvisioning={isProvisioning} />

          <div className="mt-4 flex items-center space-x-2">
            <VariantStatusIndicatorWithLabel
              status={currentVariantStatus}
              isLoading={isLoadingVariants || isProvisioning}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default VariantLaunchDialog;
