/**
 * Utility functions for date formatting
 */

/**
 * Safely format a date string to locale date string
 * @param {string|Date} dateValue - The date value to format
 * @param {string} fallback - Fallback text if date is invalid
 * @returns {string} Formatted date string or fallback
 */
export const formatDate = (dateValue, fallback = 'N/A') => {
  if (!dateValue) return fallback;
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    return date.toLocaleDateString();
  } catch (error) {
    console.warn('Invalid date value:', dateValue, error);
    return fallback;
  }
};

/**
 * Safely format a date string to locale date and time string
 * @param {string|Date} dateValue - The date value to format
 * @param {string} fallback - Fallback text if date is invalid
 * @returns {string} Formatted date and time string or fallback
 */
export const formatDateTime = (dateValue, fallback = 'N/A') => {
  if (!dateValue) return fallback;
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    return date.toLocaleString();
  } catch (error) {
    console.warn('Invalid date value:', dateValue, error);
    return fallback;
  }
};

/**
 * Safely format a date string to locale time string
 * @param {string|Date} dateValue - The date value to format
 * @param {string} fallback - Fallback text if date is invalid
 * @returns {string} Formatted time string or fallback
 */
export const formatTime = (dateValue, fallback = 'N/A') => {
  if (!dateValue) return fallback;
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    return date.toLocaleTimeString();
  } catch (error) {
    console.warn('Invalid date value:', dateValue, error);
    return fallback;
  }
};

/**
 * Get relative time string (e.g., "2 hours ago", "just now")
 * @param {string|Date} dateValue - The date value
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateValue) => {
  if (!dateValue) return 'Unknown';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return 'Unknown';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatDate(dateValue);
  } catch (error) {
    console.warn('Invalid date value:', dateValue, error);
    return 'Unknown';
  }
};
