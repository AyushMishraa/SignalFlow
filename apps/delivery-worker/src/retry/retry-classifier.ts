export class RetryClassifier {
  private static readonly NON_RETRYABLE_ERROR_CODES = new Set([
    'INVALID_RECIPIENT',
    'UNSUBSCRIBED',
    'ACCOUNT_SUSPENDED',
    'INVALID_TEMPLATE',
    'MALFORMED_REQUEST',
    'RECIPIENT_BLOCKED',
  ]);

  static isRetryable(errorCode?: string, errorMessage?: string): boolean {
    if (errorCode && this.NON_RETRYABLE_ERROR_CODES.has(errorCode)) {
      return false;
    }

    if (errorMessage) {
      const lower = errorMessage.toLowerCase();
      if (
        lower.includes('does not exist') ||
        lower.includes('invalid email') ||
        lower.includes('invalid phone') ||
        lower.includes('blacklisted')
      ) {
        return false;
      }
    }

    return true;
  }
}

