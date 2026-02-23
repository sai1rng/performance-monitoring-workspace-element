import { Box, Button, Icon, Text } from '@bosch/react-frok';
import { useNavigate, useParams } from 'react-router-dom';
import Card from './Card';
import styles from './RestrictedAccessPage.module.css';

interface RestrictedAccessPageProps {
  title?: string;
  message?: string;
  submessage?: string;
  onBackClick?: () => void;
}

const featureMessages: Record<string, { title: string; message: string }> = {
  dashboard: {
    title: 'Dashboard Access Restricted',
    message: 'You do not have permission to access the Dashboard. Please log in with appropriate credentials.',
  },
  'user-management': {
    title: 'User Management Access Restricted',
    message: 'You do not have permission to access User Management. This feature is only available to administrators.',
  },
  'cloud-resources': {
    title: 'Cloud Resources Access Restricted',
    message:
      'You do not have permission to access Cloud Resources. This feature is available to administrators and solution architects only.',
  },
  'license-management': {
    title: 'License Management Access Restricted',
    message:
      'You do not have permission to access License Management. This feature is available to administrators and solution architects only.',
  },
  'system-design': {
    title: 'System Design Access Restricted',
    message:
      'You do not have permission to access System Design. This feature is available to administrators and test system architects only.',
  },
  'component-management': {
    title: 'Component Management Access Restricted',
    message:
      'You do not have permission to access Component Management. This feature is available to administrators and test system architects only.',
  },
  'simulation-tools': {
    title: 'Simulation Tools Access Restricted',
    message:
      'You do not have permission to access Simulation Tools. This feature is available to administrators and test system integrators only.',
  },
  'model-integration': {
    title: 'Model Integration Access Restricted',
    message:
      'You do not have permission to access Model Integration. This feature is available to administrators and test system integrators only.',
  },
  'model-parameters': {
    title: 'Model Parameters Access Restricted',
    message: 'You do not have permission to access Model Parameters. This feature is only available to administrators.',
  },
  'code-access': {
    title: 'Code Access Restricted',
    message: 'You do not have permission to access Code. This feature is only available to administrators.',
  },
  'test-execution': {
    title: 'Test Execution Access Restricted',
    message: 'You do not have permission to access Test Execution. This feature is only available to administrators.',
  },
  'report-generation': {
    title: 'Report Generation Access Restricted',
    message:
      'You do not have permission to access Report Generation. This feature is only available to administrators.',
  },
  settings: {
    title: 'Settings Access Restricted',
    message: 'You do not have permission to access Settings. This feature is only available to administrators.',
  },
  'audit-logs': {
    title: 'Audit Logs Access Restricted',
    message: 'You do not have permission to access Audit Logs. This feature is only available to administrators.',
  },
  workspace: {
    title: 'Workspace Access Restricted',
    message: 'You do not have permission to access the Workspace. This feature is only available to administrators.',
  },
};

const RestrictedAccessPage = ({
  title = 'Access Restricted',
  message = "You don't have permission to access this resource.",
  submessage = 'Please contact your administrator if you need access to this feature.',
  onBackClick,
}: RestrictedAccessPageProps) => {
  const navigate = useNavigate();
  const { feature } = useParams<{ feature: string }>();

  const featureInfo = feature ? featureMessages[feature] : null;

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate('/dashboard');
    }
  };

  const cardContent = (
    <div className={styles.content}>
      <Box className={styles.iconWrapper}>
        <Icon iconName="lock-closed" className={styles.iconLarge} />
      </Box>

      <Box className={styles.textWrapper}>
        <Text as="h2" className={styles.title}>
          {featureInfo ? featureInfo.title : title}
        </Text>
        <Text className={styles.message}>{featureInfo ? featureInfo.message : message}</Text>
        <Text className={styles.submessage}>{submessage}</Text>
      </Box>

      <Button onClick={handleBackClick} icon="arrow-left">
        Back to Dashboard
      </Button>
    </div>
  );

  return (
    <div className={styles.container}>
      <Card body={cardContent} />
    </div>
  );
};

export default RestrictedAccessPage;
