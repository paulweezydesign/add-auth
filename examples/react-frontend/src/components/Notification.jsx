import { useNotification } from '../contexts/NotificationContext.jsx';

export const Notification = () => {
  const { notification } = useNotification();

  if (!notification) {
    return null;
  }

  return (
    <div className={`notification notification-${notification.type} show`}>
      {notification.message}
    </div>
  );
};
