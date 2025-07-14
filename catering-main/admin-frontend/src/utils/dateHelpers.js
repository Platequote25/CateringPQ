/**
 * Format a date to a readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

/**
 * Format time string to 12-hour format
 * @param {string} time - Time in 24-hour format (HH:MM)
 * @returns {string} Time in 12-hour format
 */
export const formatTime = (time) => {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get the start date of a week
 * @param {Date} date - Date in the week
 * @returns {Date} First day of the week (Sunday)
 */
export const getStartOfWeek = (date) => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

/**
 * Get the end date of a week
 * @param {Date} date - Date in the week
 * @returns {Date} Last day of the week (Saturday)
 */
export const getEndOfWeek = (date) => {
  const endOfWeek = getStartOfWeek(date);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
};

/**
 * Get the start date of a month
 * @param {Date} date - Date in the month
 * @returns {Date} First day of the month
 */
export const getStartOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Get the end date of a month
 * @param {Date} date - Date in the month
 * @returns {Date} Last day of the month
 */
export const getEndOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

/**
 * Get an array of dates for a week
 * @param {Date} date - Date in the week
 * @returns {Date[]} Array of 7 dates representing the week
 */
export const getWeekDates = (date) => {
  const start = getStartOfWeek(date);
  const dates = [];
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    dates.push(day);
  }
  
  return dates;
};

/**
 * Format date for input[type="date"]
 * @param {Date} date - Date to format
 * @returns {string} Date in format YYYY-MM-DD
 */
export const formatDateForInput = (date) => {
  return date.toISOString().split('T')[0];
}; 