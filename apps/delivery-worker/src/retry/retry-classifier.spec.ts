import { RetryClassifier } from './retry-classifier';

describe('RetryClassifier', () => {
  it('should identify transient network/rate limit errors as retryable', () => {
    expect(RetryClassifier.isRetryable('TIMEOUT', 'Connection timed out')).toBe(true);
    expect(RetryClassifier.isRetryable('RATE_LIMIT', 'Too many requests')).toBe(true);
    expect(RetryClassifier.isRetryable('PROVIDER_503', 'Service unavailable')).toBe(true);
  });

  it('should identify permanent failures as non-retryable', () => {
    expect(RetryClassifier.isRetryable('INVALID_RECIPIENT')).toBe(false);
    expect(RetryClassifier.isRetryable('UNSUBSCRIBED')).toBe(false);
    expect(RetryClassifier.isRetryable('ACCOUNT_SUSPENDED')).toBe(false);
    expect(RetryClassifier.isRetryable(undefined, 'email address does not exist')).toBe(false);
  });
});

