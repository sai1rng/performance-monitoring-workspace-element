import React, { ReactNode } from 'react';
import { Button, Text, Icon, Chip } from '@bosch/react-frok';

export interface ActionButton {
  label: string;
  onClick?: () => void;
  className?: string;
  icon?: string;
  isError?: boolean;
}

export interface NotificationCardProps {
  /**
   * Icon name to display
   */
  iconName: string;
  /**
   * Title of the notification
   */
  title: string;
  /**
   * Description/content of the notification
   */
  description: string | ReactNode;
  /**
   * Time when notification was received
   */
  time: string;
  /**
   * Priority level label
   */
  priority: {
    label: string;
    type: 'success' | 'error' | 'warning';
  };
  /**
   * Action buttons configuration
   */
  actions: ActionButton[];
}

/**
 * NotificationCard component for displaying user events and notifications
 */
const NotificationCard: React.FC<NotificationCardProps> = ({
  iconName,
  title,
  description,
  time,
  priority,
  actions,
}) => {
  return (
    <>
      <div
        style={{
          padding: '2px',
          backgroundColor: '#eee',
          borderBottom: '1px solid #eee',
        }}
      ></div>

      <div className="rounded-lg border-l-4 border-primary bg-white p-4 shadow-sm">
        <div className="flex items-start">
          {/* Left Side - Icon */}
          <div className="mr-4 flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bosch-gray-90">
              <Icon iconName={iconName} />
            </div>
          </div>

          {/* Middle Section - Content */}
          <div className="flex-grow space-y-4">
            <h3 className="mb-1 font-bold">{title}</h3>
            {typeof description === 'string' ? <Text>{description}</Text> : description}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  label={action.label}
                  onClick={action.onClick}
                  icon={action.icon}
                  className={action.isError ? 'bg-bosch-red hover:bg-bosch-red-55' : action.className}
                />
              ))}
            </div>
          </div>

          {/* Right Side - Timestamp and Priority */}
          <div className="ml-4 flex-shrink-0 text-right">
            <div className="mb-2 flex items-center gap-1 text-sm text-gray-500">
              <Icon iconName="clock" className="text-[16px]" />
              <span>{time}</span>
            </div>
            <Chip label={priority.label} className={`chip-${priority.type}`} />
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationCard;
