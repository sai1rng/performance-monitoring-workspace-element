import React, { ReactNode } from 'react';
import { Button, Text, Icon, Chip } from '@bosch/react-frok';

export interface NotificationItemProps {
  iconName: string;
  title: string;
  description: string | ReactNode;
  time: string;
  priority: {
    label: string;
    type: 'warning' | 'info';
  };

  isRead: boolean;

  onClick?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  iconName,
  title,
  description,
  time,
  priority,
  onClick,
  isRead,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px',
        backgroundColor: '#ffffffff',
        borderBottom: '3px solid #e0e0e0',
        cursor: 'pointer',
        ...(!isRead && {
          backgroundColor: '#feffd3ff',
          font: 'bold',
          fontWeight: 'bold',
        }),
      }}
      className="rounded-lg border-l-4 bg-white p-4 shadow-sm"
    >
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
  );
};

export default NotificationItem;
