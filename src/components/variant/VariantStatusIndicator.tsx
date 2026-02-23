import styles from './VariantStatusIndicator.module.css';
import { VariantStatus } from '../../types/variantLaunchDialog.type';

interface VariantStatusIndicatorProps {
  variantStatus?: VariantStatus;
}

const getStatusColor = (variantStatus?: string): string => {
  switch (variantStatus) {
    case VariantStatus.LAUNCHED:
      return styles.statusIndicatorGreen;
    case VariantStatus.PROVISIONING:
    case VariantStatus.DEPROVISIONING:
    case VariantStatus.STARTING:
    case VariantStatus.STOPPING:
      return styles.statusIndicatorBlue;
    case VariantStatus.PROVISIONING_ERROR:
    case VariantStatus.STARTING_ERROR:
    case VariantStatus.STOPPING_ERROR:
      return styles.statusIndicatorRed;
    case VariantStatus.STOPPED:
      return styles.statusIndicatorGray;
    case VariantStatus.DEPROVISIONED:
      return styles.statusIndicatorYellow;
    default:
      return styles.statusIndicatorYellow;
  }
};

const VariantStatusIndicator = ({ variantStatus: status }: VariantStatusIndicatorProps) => {
  return <div className={`${styles.statusIndicator} ${getStatusColor(status)}`} />;
};

export default VariantStatusIndicator;
