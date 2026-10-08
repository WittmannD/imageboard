/**
 * Runs at most `concurrency` jobs at once, the rest wait in FIFO order.
 * Every message the Redis transport delivers is handled right away, so this is
 * what keeps a burst of uploads from starting that many ffmpeg processes.
 */
export class JobQueue {
  private running = 0;
  private readonly waiting: (() => void)[] = [];

  constructor(private readonly concurrency: number) {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new RangeError('concurrency must be a positive integer');
    }
  }

  /** Jobs waiting for a free slot. */
  public get pending(): number {
    return this.waiting.length;
  }

  public async run<T>(job: () => Promise<T>): Promise<T> {
    await this.acquire();

    try {
      return await job();
    } finally {
      this.release();
    }
  }

  private async acquire(): Promise<void> {
    if (this.running < this.concurrency) {
      this.running++;
      return;
    }

    await new Promise<void>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  private release(): void {
    const next = this.waiting.shift();

    // hand the slot over to the next job instead of freeing it
    if (next) {
      next();
    } else {
      this.running--;
    }
  }
}
