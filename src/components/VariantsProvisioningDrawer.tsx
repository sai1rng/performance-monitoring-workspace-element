import { Text } from '@bosch/react-frok';
import { useCompoundProductVersionStatus } from '@services/vew.query';
import FlexTable, { ColumnDef } from './atoms/FlexTable';
import { getDisplayStatus, isActionDisabled, isValidVariantStatus } from '@utils/common';
import useModalStore from '@hooks/useModalStore';
import Modal from './Modal';
import { Workspace } from 'src/types/workspace.type';
import React, { useEffect, useState } from 'react';
import ProvisioningDialog from './molecules/dialogs/ProvisioningDialog';
import {
  PROVISIONING_DIALOG_TYPES,
  ProvisioningDialogType,
  WORKSPACE_PAGE_CONSTANTS,
  WORKSPACE_STATUS_CONSTANTS,
} from '@constants/workspace.constants';
import { CompoundProductVersionStatues } from 'src/types/vew.type';
import Progress from './atoms/Progress';
import { VariantActionCell } from './VariantActionCell';
import VariantStatusIndicator from './variant/VariantStatusIndicator';
import SearchTextField from './atoms/SearchTextField';

interface VariantsProvisioningDrawerProps {
  workspace: Workspace;
}

const VariantsProvisioningDrawer = ({ workspace }: VariantsProvisioningDrawerProps) => {
  const [selectedVariant, setSelectedVariant] = useState<CompoundProductVersionStatues | null>(null);
  const [dialogType, setDialogType] = useState<ProvisioningDialogType>(PROVISIONING_DIALOG_TYPES.PROVISION);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { openModal } = useModalStore();
  const { data: compoundProductVersions, isFetching: isLoading } = useCompoundProductVersionStatus(
    workspace.id.toString(),
    workspace.compoundProducts?.[0]?.id
  );

  const filteredData = React.useMemo(() => {
    if (!compoundProductVersions || !searchQuery.trim()) {
      return compoundProductVersions || [];
    }

    return compoundProductVersions.filter(
      (variant) => variant.variantName?.toLowerCase().includes(searchQuery.trim().toLowerCase()) ?? false
    );
  }, [compoundProductVersions, searchQuery]);

  const handleSearchReset = () => {
    setSearchQuery('');
  };

  const versionsColumns: ColumnDef<any>[] = [
    { header: 'Variant Name', accessor: 'variantName' },
    {
      header: 'Status',
      accessor: 'variantStatus',
      cellRenderer: (variantStatus) => {
        if (!isValidVariantStatus(variantStatus))
          return <Text>{WORKSPACE_STATUS_CONSTANTS.STATUSES.NOT_AVAILABLE}</Text>;

        return (
          <div className="flex items-center">
            {!isActionDisabled(variantStatus) && (
              <div className="mr-1">
                <VariantStatusIndicator variantStatus={variantStatus} />
              </div>
            )}
            {`${getDisplayStatus(variantStatus)}${isActionDisabled(variantStatus) ? '...' : ''}`}
          </div>
        );
      },
    },
    {
      header: 'Action',
      accessor: () => null,
      cellRenderer: (_, variant: CompoundProductVersionStatues) => (
        <VariantActionCell variant={variant} onProvisioning={handleProvisioning} />
      ),
    },
  ];

  const handleProvisioning = (variant: CompoundProductVersionStatues, type: ProvisioningDialogType) => {
    setSelectedVariant(variant);
    setDialogType(type);
  };

  useEffect(() => {
    if (selectedVariant) {
      openModal(
        WORKSPACE_PAGE_CONSTANTS.MODALS.PROVISIONING,
        <ProvisioningDialog
          variant={selectedVariant}
          workspace={workspace}
          type={dialogType}
          modalName={WORKSPACE_PAGE_CONSTANTS.MODALS.PROVISIONING}
          setSelectedVariant={setSelectedVariant}
        />
      );
    }
  }, [dialogType, selectedVariant, workspace, openModal]);

  return (
    <div className="flex flex-col gap-4">
      <Text>{workspace.workspaceName}</Text>
      <SearchTextField
        id="variantSearchField"
        placeholder="Search variant"
        value={searchQuery}
        onChange={(value) => setSearchQuery(value)}
        onReset={handleSearchReset}
        onSearch={() => {}}
        title="Enter variant name"
      />
      {isLoading ? (
        <Progress message="Loading variants statuses ..." />
      ) : (
        <FlexTable keyExtractor={(item) => item.variantId} columns={versionsColumns} data={filteredData} />
      )}
      <Modal modalName={WORKSPACE_PAGE_CONSTANTS.MODALS.PROVISIONING} />
    </div>
  );
};

export default VariantsProvisioningDrawer;
