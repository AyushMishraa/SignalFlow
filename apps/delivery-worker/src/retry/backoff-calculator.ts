export class BackoffCalculator {
  static calculateDelayMs(
    attempt: number,
    baseDelayMs: number = 1000,
    maxDelayMs: number = 30000,
  ): number {
    const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
    // Full jitter formula: random between 0 and exponential
    const jitter = Math.random() * exponential;
    return Math.floor(jitter);
  }
}

