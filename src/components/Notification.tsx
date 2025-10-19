import React, { useEffect } from 'react';

export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationProps {
  notification: NotificationItem;
  onClose: (id: string) => void;
}

export const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, notification.duration || 3000);

    return () => clearTimeout(timer);
  }, [notification.id, notification.duration, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      case 'warning':
        return 'bg-yellow-600';
      case 'info':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div
      className={`
        absolute top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full
        transition-all duration-300 ease-in-out
        animate-slide-in-right
      `}
    >
      <div className={`
        ${getBackgroundColor()}
        text-white rounded-lg shadow-lg p-4
        flex items-start space-x-3
        backdrop-blur-sm bg-opacity-95
        border border-white border-opacity-20
      `}>
        <div className="flex-shrink-0 text-xl">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm mb-1">
            {notification.title}
          </div>
          <div className="text-sm opacity-90">
            {notification.message}
          </div>
        </div>
        <button
          onClick={() => onClose(notification.id)}
          className="flex-shrink-0 ml-2 text-white opacity-70 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

interface NotificationContainerProps {
  notifications: NotificationItem[];
  onClose: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onClose
}) => {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <Notification notification={notification} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};

export const KLineNotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onClose
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-4 pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <Notification notification={notification} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};
