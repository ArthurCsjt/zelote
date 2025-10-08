// Helper functions for handling nullable dates
import { format as dateFnsFormat } from 'date-fns';

export const formatDate = (date: string | null | undefined, formatString: string): string => {
  if (!date) return 'N/A';
  try {
    return dateFnsFormat(new Date(date), formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

export const toDate = (date: string | null | undefined): Date | null => {
  if (!date) return null;
  try {
    return new Date(date);
  } catch (error) {
    console.error('Error converting to date:', error);
    return null;
  }
};
