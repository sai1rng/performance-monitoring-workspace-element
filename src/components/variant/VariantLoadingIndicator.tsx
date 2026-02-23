import Progress from '@components/atoms/Progress';

interface VariantLoadingIndicatorProps {
  isLoadingVariants?: boolean;
  isProvisioning?: boolean;
}

const VariantLoadingIndicator = ({ isLoadingVariants, isProvisioning }: VariantLoadingIndicatorProps) => {
  if (!isLoadingVariants && !isProvisioning) return null;

  const getMessage = () => {
    if (isProvisioning) return 'Provisioning...';
    if (isLoadingVariants) return 'Loading variants...';
    return '';
  };

  return <Progress message={getMessage()} />;
};

export default VariantLoadingIndicator;
