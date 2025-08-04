export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateNumber = (
  value: number,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): { isValid: boolean; error?: string } => {
  const { min, max, integer = false } = options;

  if (isNaN(value)) {
    return { isValid: false, error: 'Must be a valid number' };
  }

  if (integer && !Number.isInteger(value)) {
    return { isValid: false, error: 'Must be an integer' };
  }

  if (min !== undefined && value < min) {
    return { isValid: false, error: `Must be at least ${min}` };
  }

  if (max !== undefined && value > max) {
    return { isValid: false, error: `Must be at most ${max}` };
  }

  return { isValid: true };
};