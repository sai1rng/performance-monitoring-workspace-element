import React, { useEffect } from 'react';
import { Notification } from '@bosch/react-frok';
import useNotificationStore from '@hooks/useNotificationStore';

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();

  // Setup automatic cleanup for notifications that are set to auto-close
  useEffect(() => {
    notifications.forEach((notification) => {
      if (notification.autoClose && notification.duration) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, removeNotification]);

  if (notifications.length === 0) {
    return null;
  }

  // Limit visible notifications to 5 at a time to prevent overwhelming the UI
  const visibleNotifications = notifications.slice(0, 5);
  const hiddenCount = Math.max(0, notifications.length - 5);

  return (
    <div className="fixed left-0 right-0 top-0 z-50 p-4">
      <div className="flex flex-col items-center">
        {visibleNotifications.map((notification) => (
          <div key={notification.id} className="animate-fade-in mb-2 w-full max-w-md">
            <Notification type={notification.type}>{notification.message}</Notification>
          </div>
        ))}

        {hiddenCount > 0 && (
          <div className="mt-2 rounded bg-gray-700 px-4 py-2 text-xs text-white">
            {hiddenCount} more notification{hiddenCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

// Add a fade-in animation
const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out forwards;
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default NotificationContainer;
