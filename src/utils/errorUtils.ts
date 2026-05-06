
export const getFriendlyErrorMessage = (error: any): string => {
  const code = error?.code || '';
  const message = error?.message || '';
  const combined = `${code} ${message}`.toLowerCase();
  
  if (combined.includes('permission-denied') || combined.includes('unauthorized')) {
    return 'You do not have permission to perform this action. Your session might have expired.';
  }
  
  if (combined.includes('network-request-failed') || combined.includes('offline')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  if (combined.includes('quota-exceeded')) {
    return 'Daily usage limit reached. Service will resume shortly. Please try again later.';
  }
  
  if (combined.includes('unavailable')) {
    return 'Service is temporarily unavailable. Please try again in a few moments.';
  }
  
  if (combined.includes('storage/object-not-found')) {
    return 'The requested file could not be found.';
  }

  if (combined.includes('storage/retry-limit-exceeded') || combined.includes('timeout')) {
    return 'The operation took too long. Please try again.';
  }

  if (combined.includes('already-exists')) {
      return 'A record with this information already exists.';
  }

  if (combined.includes('invalid-argument')) {
    return 'Some information provided is incorrect. Please check the fields and try again.';
  }

  if (combined.includes('file-too-large') || combined.includes('size must be less than')) {
      return 'The selected file is too large. Please choose a smaller image (max 2MB).';
  }

  return 'An unexpected error occurred. Please try again later.';
};
