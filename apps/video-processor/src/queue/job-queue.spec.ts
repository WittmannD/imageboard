import { describe, expect, it } from 'vitest';

import { JobQueue } from './job-queue.js';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

// lets every pending promise callback run
const flush = () =>
  new Promise<void>((resolve) => {
    setImmediate(resolve);
  });

describe('JobQueue', () => {
  it('runs at most `concurrency` jobs at once, in FIFO order', async () => {
    const queue = new JobQueue(2);
    const started: number[] = [];
    const gates = [deferred(), deferred(), deferred(), deferred()];

    const runs = gates.map((gate, index) =>
      queue.run(async () => {
        started.push(index);
        await gate.promise;
        return index;
      }),
    );
    await flush();

    expect(started).toEqual([0, 1]);
    expect(queue.pending).toBe(2);

    gates[1]?.resolve();
    await runs[1];
    await flush();
    expect(started).toEqual([0, 1, 2]);

    gates[0]?.resolve();
    gates[2]?.resolve();
    gates[3]?.resolve();
    await expect(Promise.all(runs)).resolves.toEqual([0, 1, 2, 3]);
    expect(queue.pending).toBe(0);
  });

  it('frees the slot of a failed job', async () => {
    const queue = new JobQueue(1);

    await expect(
      queue.run(() => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');
    await expect(queue.run(() => Promise.resolve('next'))).resolves.toBe(
      'next',
    );
  });

  it('rejects an invalid concurrency', () => {
    expect(() => new JobQueue(0)).toThrow(RangeError);
  });
});
