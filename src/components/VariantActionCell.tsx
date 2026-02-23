import React from 'react';
import { checkStatus, getProvisioningActionByStatus } from '@utils/common';
import {
  PROVISIONING_DIALOG_TYPES,
  ProvisioningDialogType,
  WORKSPACE_STATUS_CONSTANTS,
} from '@constants/workspace.constants';
import { CompoundProductVersionStatues } from 'src/types/vew.type';
import { ActionMenu, MenuAction } from './VariantActionMenu';

interface VariantActionCellProps {
  variant: CompoundProductVersionStatues;
  onProvisioning: (variant: CompoundProductVersionStatues, type: ProvisioningDialogType) => void;
}

const getActionsByStatus = (status: string): MenuAction[] => {
  if (status === WORKSPACE_STATUS_CONSTANTS.STATUSES.DEPROVISIONED) {
    return [
      {
        label: WORKSPACE_STATUS_CONSTANTS.ACTIONS.PROVISION,
        value: WORKSPACE_STATUS_CONSTANTS.ACTIONS.PROVISION,
        action: PROVISIONING_DIALOG_TYPES.PROVISION,
      },
    ];
  }

  if (status === WORKSPACE_STATUS_CONSTANTS.STATUSES.PROVISIONING_ERROR) {
    return [
      {
        label: WORKSPACE_STATUS_CONSTANTS.ACTIONS.DEPROVISION,
        value: WORKSPACE_STATUS_CONSTANTS.ACTIONS.DEPROVISION,
        action: PROVISIONING_DIALOG_TYPES.TERMINATE,
      },
    ];
  }

  if (
    checkStatus(status, [
      WORKSPACE_STATUS_CONSTANTS.STATUSES.LAUNCHED,
      WORKSPACE_STATUS_CONSTANTS.STATUSES.STOPPING_ERROR,
    ])
  ) {
    const isStoppingError = checkStatus(status, [WORKSPACE_STATUS_CONSTANTS.STATUSES.STOPPING_ERROR]);

    return [
      {
        label: isStoppingError ? WORKSPACE_STATUS_CONSTANTS.ACTIONS.RETRY : WORKSPACE_STATUS_CONSTANTS.ACTIONS.STOP,
        value: WORKSPACE_STATUS_CONSTANTS.ACTIONS.STOP,
        action: PROVISIONING_DIALOG_TYPES.STOP,
      },
      {
        label: WORKSPACE_STATUS_CONSTANTS.ACTIONS.DEPROVISION,
        value: WORKSPACE_STATUS_CONSTANTS.ACTIONS.DEPROVISION,
        action: PROVISIONING_DIALOG_TYPES.TERMINATE,
      },
    ];
  }

  if (
    checkStatus(status, [
      WORKSPACE_STATUS_CONSTANTS.STATUSES.STOPPED,
      WORKSPACE_STATUS_CONSTANTS.STATUSES.STARTING_ERROR,
    ])
  ) {
    const isStartingError = checkStatus(status, [WORKSPACE_STATUS_CONSTANTS.STATUSES.STARTING_ERROR]);

    return [
      {
        label: isStartingError ? WORKSPACE_STATUS_CONSTANTS.ACTIONS.RETRY : WORKSPACE_STATUS_CONSTANTS.ACTIONS.START,
        value: WORKSPACE_STATUS_CONSTANTS.ACTIONS.START,
        action: PROVISIONING_DIALOG_TYPES.START,
      },
      {
        label: WORKSPACE_STATUS_CONSTANTS.ACTIONS.DEPROVISION,
        value: WORKSPACE_STATUS_CONSTANTS.ACTIONS.DEPROVISION,
        action: PROVISIONING_DIALOG_TYPES.TERMINATE,
      },
    ];
  }

  return [];
};

const isDisabledStatus = (status: string): boolean => {
  return checkStatus(status, [
    WORKSPACE_STATUS_CONSTANTS.STATUSES.PROVISIONING,
    WORKSPACE_STATUS_CONSTANTS.STATUSES.DEPROVISIONING,
    WORKSPACE_STATUS_CONSTANTS.STATUSES.STARTING,
    WORKSPACE_STATUS_CONSTANTS.STATUSES.STOPPING,
  ]);
};

export const VariantActionCell: React.FC<VariantActionCellProps> = ({ variant, onProvisioning }) => {
  const status =
    WORKSPACE_STATUS_CONSTANTS.STATUSES[variant.variantStatus as keyof typeof WORKSPACE_STATUS_CONSTANTS.STATUSES];

  const disabled = isDisabledStatus(status);
  const actions = disabled
    ? [
        {
          label: getProvisioningActionByStatus(variant.variantStatus),
          value: getProvisioningActionByStatus(variant.variantStatus),
          action: '',
        },
      ]
    : getActionsByStatus(status);

  if (actions.length === 0) {
    return <span>{WORKSPACE_STATUS_CONSTANTS.ACTIONS.NOT_AVAILABLE}</span>;
  }

  return (
    <ActionMenu
      actions={actions}
      onAction={(action) => onProvisioning(variant, action as ProvisioningDialogType)}
      disabled={disabled}
    />
  );
};
