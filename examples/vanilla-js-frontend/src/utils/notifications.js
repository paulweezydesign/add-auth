/**
 * Show notification message
 */
export const showNotification = (message, type = 'info') => {
  const notificationEl = document.getElementById('notification');
  
  notificationEl.textContent = message;
  notificationEl.className = `notification notification-${type} show`;
  
  setTimeout(() => {
    notificationEl.classList.remove('show');
  }, 3000);
};
