import React from 'react';
import styles from './VariantStatusTooltip.module.css';
import VariantStatusIndicator from '@components/variant/VariantStatusIndicator';
import { VariantStatus } from '../../types/variantLaunchDialog.type';
import { getStatusLabel } from '@utils/variant';

const VariantStatusTooltip: React.FC = () => {
  const statuses = (Object.values(VariantStatus) as Array<VariantStatus | string>).filter(
    (s) => typeof s === 'string'
  ) as VariantStatus[];

  return (
    <div className={styles.variantStatusTooltip}>
      <div className={styles.tooltipTitle}>Variant Statuses:</div>
      <div className={styles.statusList}>
        {statuses.map((status) => (
          <div key={status} className={styles.statusItem}>
            <VariantStatusIndicator variantStatus={status} />
            <span className={styles.statusText}>{getStatusLabel(status)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VariantStatusTooltip;
