import React, { useEffect, useRef, useState } from 'react';
import NotificationItem from './NotificationItem';
import { useNavigate } from 'react-router-dom';
import { formatDatetime } from '@utils/utils';
import './notification.css';
import { useMakeNotificationAsRead } from '@services/notification.query';
import { NotificationDto } from 'src/types/notification.type';
import { List } from 'src/types/common.type';
import { USER_MANAGEMENT_URL } from '../constants/Constant';

type NotificationPopupProps = {
  listNotification: List<NotificationDto> | undefined;
  showNotification: boolean;
  setShowNotification: React.Dispatch<React.SetStateAction<boolean>>;
};

const NotificationPopup = ({ listNotification, showNotification, setShowNotification }: NotificationPopupProps) => {
  const defaultVisibleCount = 10;
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(defaultVisibleCount);
  const makeNotificationAsRead = useMakeNotificationAsRead();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotification(false);
      }
    }

    if (showNotification) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotification, listNotification, setShowNotification]);

  const showMore = () => {
    setVisibleCount((prev) => Math.min(prev + defaultVisibleCount, listNotification?.totalElements ?? 0));
  };

  const handleNotificationItemClick = (item: NotificationDto) => {
    setShowNotification(false);
    switch (item.type) {
      case 'ACCESS_REQUEST':
        navigate(USER_MANAGEMENT_URL, {
          state: { highlightId: 'request-access-section' },
        });
    }
    if (!item.isRead) {
      makeNotificationAsRead.mutate(item.id);
    }
  };

  return (
    <div className="relative">
      {showNotification && (
        <div className="notification-list z-10" ref={notificationRef}>
          <p className="p-3 font-bold">Notifications</p>
          {listNotification?.totalElements === 0 && <p className="p-3">You have no notification at this time.</p>}
          {listNotification?.content
            .slice(0, visibleCount)
            .map((item, index) => (
              <NotificationItem
                key={index}
                title={item.title}
                description={item.message}
                time={formatDatetime(item.createdAt)}
                priority={item.isRead ? { label: 'Read', type: 'info' } : { label: 'New', type: 'warning' }}
                iconName={'notification'}
                isRead={item.isRead}
                onClick={() => handleNotificationItemClick(item)}
              />
            ))}
          <div className="show-more-section">
            {visibleCount < (listNotification?.totalElements ?? 0) && (
              <button className="show-more-button" onClick={showMore}>
                Show more
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPopup;
