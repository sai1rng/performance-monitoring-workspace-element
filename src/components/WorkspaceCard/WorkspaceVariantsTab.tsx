import React from 'react';
import { Text, Table, TableBody, TableRow, TableCell, TableHead } from '@bosch/react-frok';
import { useCompoundProductVersions, useVariantStatuses } from '@services/vew.query';
import { Workspace } from '../../types/workspace.type';
import { Link } from 'react-router-dom';
import { useTooltip } from '@hooks/useTooltip';
import VariantStatusTooltip from './VariantStatusTooltip';
import styles from './WorkspaceDetailsSidebar.module.css';
import { VariantStatus } from '../../types/variantLaunchDialog.type';
import Progress from '@components/atoms/Progress';
import VariantStatusIndicator from '@components/variant/VariantStatusIndicator';

interface Version {
  versionId?: string;
  id?: string;
  versionName?: string;
  name?: string;
  label?: string;
}

interface WorkspaceVariantsTabProps {
  workspace: Workspace;
}

const getVersionName = (version: Version, index: number): string => {
  return (
    version.versionName || version.name || version.label || version.versionId || version.id || `Version ${index + 1}`
  );
};

const ViewLink: React.FC = () => (
  <Link to="https://bosch.com" target="_blank" className={styles.viewLink}>
    View
  </Link>
);

const ErrorState: React.FC<{ error: any }> = ({ error }) => (
  <div>
    <p>Error loading data: {error.message}</p>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div>
    <p>{message}</p>
  </div>
);

const WorkspaceVariantsTab: React.FC<WorkspaceVariantsTabProps> = ({ workspace }) => {
  const { isVisible: showTooltip, showTooltip: handleShowTooltip, hideTooltip: handleHideTooltip } = useTooltip();
  const compoundProduct = workspace.compoundProducts?.[0];
  const compoundProductId = compoundProduct?.id;

  const showArchitectureDetails = false;

  const versionsQuery = useCompoundProductVersions(compoundProductId || '');
  const { data: versionsData, isLoading: isLoadingVersions, error: versionsError } = versionsQuery;

  const variantStatusesQuery = useVariantStatuses(workspace.id, compoundProductId || '');
  const { data: variantStatusesData, isLoading: isLoadingStatuses, error: statusesError } = variantStatusesQuery;

  const versions = versionsData?.compoundProductVersions || [];
  const variantStatuses = variantStatusesData || [];

  if (!compoundProduct) {
    return <EmptyState message="No compound product found for this workspace." />;
  }

  if (isLoadingVersions || isLoadingStatuses) {
    return <Progress message="Loading versions and statuses..." />;
  }

  if (versionsError || statusesError) {
    return <ErrorState error={versionsError || statusesError} />;
  }

  const getVariantStatusByVariantId = (variantId?: string): string | undefined => {
    if (!variantId) return undefined;
    const status = variantStatuses.find((vs) => vs.variantId === variantId);
    return status?.variantStatus;
  };

  const getVariantTableRows = () => {
    const rows = [];

    if (versions.length > 0) {
      versions.forEach((version: Version, index: number) => {
        const variantId = version.versionId || version.id;
        const variantStatus = getVariantStatusByVariantId(variantId);

        rows.push(
          <TableRow key={variantId || index}>
            <TableCell>
              <div className={styles.variantRow}>
                <VariantStatusIndicator variantStatus={variantStatus as VariantStatus} />
                <Text>{getVersionName(version, index)}</Text>
              </div>
            </TableCell>
            <TableCell className={showArchitectureDetails ? '' : styles.hiddenColumn}>
              <ViewLink />
            </TableCell>
          </TableRow>
        );
      });
    } else {
      rows.push(
        <TableRow key="no-versions">
          <TableCell colSpan={2}>
            <Text>No versions available</Text>
          </TableCell>
        </TableRow>
      );
    }

    return rows;
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell header>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span>Variant Name </span>
              <i
                className="a-icon ui-ic-alert-info"
                style={{
                  fontSize: '20px',
                  cursor: 'default',
                }}
                onMouseEnter={handleShowTooltip}
                onMouseLeave={handleHideTooltip}
              />
              {showTooltip && (
                <div className={styles.tooltipContainer}>
                  <VariantStatusTooltip />
                </div>
              )}
            </div>
          </TableCell>
          <TableCell header className={showArchitectureDetails ? '' : styles.hiddenColumn}>
            <span>Architecture Details</span>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>{getVariantTableRows()}</TableBody>
    </Table>
  );
};

export default WorkspaceVariantsTab;
