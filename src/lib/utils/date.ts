/**
 * Date validation and formatting utilities
 */

export interface DateValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate a date string
 */
export function validateDate(dateString: string): DateValidationResult {
  if (!dateString) {
    return { isValid: false, error: 'Date is required' };
  }

  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  return { isValid: true };
}

/**
 * Validate date range (start must be before end)
 */
export function validateDateRange(
  startDate: string, 
  endDate: string, 
  allowCurrentPosition: boolean = false
): DateValidationResult {
  if (!startDate) {
    return { isValid: false, error: 'Start date is required' };
  }

  if (!endDate && !allowCurrentPosition) {
    return { isValid: false, error: 'End date is required for past positions' };
  }

  if (!endDate && allowCurrentPosition) {
    return { isValid: true }; // Current position, no end date needed
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return { isValid: false, error: 'Invalid start date' };
  }

  if (isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid end date' };
  }

  if (end < start) {
    return { isValid: false, error: 'End date cannot be before start date' };
  }

  return { isValid: true };
}

/**
 * Validate that a date is not in the future (for past positions)
 */
export function validatePastDate(dateString: string): DateValidationResult {
  if (!dateString) {
    return { isValid: false, error: 'Date is required' };
  }

  const date = new Date(dateString);
  const today = new Date();
  
  // Reset time to compare dates only
  today.setHours(23, 59, 59, 999);

  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  if (date > today) {
    return { isValid: false, error: 'Date cannot be in the future' };
  }

  return { isValid: true };
}

/**
 * Format a date string for display
 */
export function formatDate(
  dateString: string | null, 
  format: 'short' | 'long' | 'month-year' = 'month-year'
): string | null {
  if (!dateString) return null;

  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return null;

  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    
    case 'long':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    
    case 'month-year':
    default:
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
  }
}

/**
 * Format a date range for display
 */
export function formatDateRange(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean = false,
  format: 'short' | 'long' | 'month-year' = 'month-year'
): string {
  const start = formatDate(startDate, format);
  const end = isCurrent ? 'Present' : formatDate(endDate, format);

  if (start && end) {
    return `${start} - ${end}`;
  } else if (start) {
    return start;
  } else if (end && !isCurrent) {
    return `Until ${end}`;
  } else {
    return 'Date not specified';
  }
}

/**
 * Calculate duration between two dates
 */
export function calculateDuration(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean = false
): string {
  if (!startDate) return '';

  const start = new Date(startDate);
  const end = isCurrent ? new Date() : (endDate ? new Date(endDate) : new Date());

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return '';
  }

  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

  if (months < 1) {
    return '(Less than 1 month)';
  }

  if (months < 12) {
    return `(${months} month${months === 1 ? '' : 's'})`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return `(${years} year${years === 1 ? '' : 's'})`;
  }

  return `(${years} year${years === 1 ? '' : 's'} ${remainingMonths} month${remainingMonths === 1 ? '' : 's'})`;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Convert date to YYYY-MM-DD format
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse date string safely
 */
export function parseDate(dateString: string | null): Date | null {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Compare two dates (returns -1, 0, or 1)
 */
export function compareDates(date1: string | null, date2: string | null): number {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);

  if (!d1 && !d2) return 0;
  if (!d1) return -1;
  if (!d2) return 1;

  return d1.getTime() - d2.getTime();
}

/**
 * Get the first day of a month
 */
export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/**
 * Get the last day of a month
 */
export function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}
