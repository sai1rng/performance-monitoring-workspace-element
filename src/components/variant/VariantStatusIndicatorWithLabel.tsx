import { getStatusLabel } from '@utils/variant';
import VariantStatusIndicator from './VariantStatusIndicator';
import { VariantStatus } from '../../types/variantLaunchDialog.type';

type VariantStatusIndicatorWithLabelProps = {
  status?: VariantStatus;
  isLoading?: boolean;
};

const VariantStatusIndicatorWithLabel = ({ status, isLoading }: VariantStatusIndicatorWithLabelProps) => {
  if (isLoading) return null;

  const shouldHideStatusIndicator = [
    VariantStatus.DEPROVISIONING,
    VariantStatus.PROVISIONING,
    VariantStatus.STARTING,
    VariantStatus.STOPPING,
  ].includes(status as VariantStatus);

  return (
    <>
      {!shouldHideStatusIndicator && <VariantStatusIndicator variantStatus={status} />}
      <span>{getStatusLabel(status)}</span>
    </>
  );
};

export default VariantStatusIndicatorWithLabel;
