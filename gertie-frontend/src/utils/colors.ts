// src/utils/colors.ts

export const getRiskColorClass = (riskLevel: string): string => {
  switch (riskLevel.toLowerCase()) {
    case 'low':
      return 'text-green-600 dark:text-green-400';
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'high':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

export const getChangeColorClass = (changeValue: number): string => {
  if (changeValue > 0) {
    return 'text-green-600 dark:text-green-400';
  } else if (changeValue < 0) {
    return 'text-red-600 dark:text-red-400';
  } else {
    return 'text-gray-600 dark:text-gray-400';
  }
};

export const getRiskBgClass = (riskLevel: string): string => {
  switch (riskLevel.toLowerCase()) {
    case 'low':
      return 'bg-green-100 dark:bg-green-900/20';
    case 'medium':
      return 'bg-yellow-100 dark:bg-yellow-900/20';
    case 'high':
      return 'bg-red-100 dark:bg-red-900/20';
    default:
      return 'bg-gray-100 dark:bg-gray-900/20';
  }
};

export const getChangeBgClass = (changeValue: number): string => {
  if (changeValue > 0) {
    return 'bg-green-100 dark:bg-green-900/20';
  } else if (changeValue < 0) {
    return 'bg-red-100 dark:bg-red-900/20';
  } else {
    return 'bg-gray-100 dark:bg-gray-900/20';
  }
};