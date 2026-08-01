import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AlreadyExistsError } from '../errors/already-exists-error.js';
import { LocalStorageDriver } from './local-storage-driver.js';

const streamToBuffer = async (stream: NodeJS.ReadableStream) => {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

describe('LocalStorageDriver', () => {
  let root: string;
  let driver: LocalStorageDriver;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.resolve('./test', 'local-storage-driver-'));
    driver = new LocalStorageDriver({ root });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('uploads a buffer and returns stored file metadata', async () => {
    const body = Buffer.from('file content');

    const stored = await driver.upload({
      key: 'images/original.txt',
      body,
    });

    await expect(
      fs.readFile(path.join(root, 'images', 'original.txt')),
    ).resolves.toEqual(body);

    expect(stored).toEqual({
      key: 'images/original.txt',
      size: body.length,
    });
  });

  it('uploads a readable stream', async () => {
    const body = Buffer.from('stream content');

    const stored = await driver.upload({
      key: 'streams/file.txt',
      body: Readable.from(body),
    });

    await expect(
      fs.readFile(path.join(root, 'streams', 'file.txt')),
    ).resolves.toEqual(body);

    expect(stored).toEqual({
      key: 'streams/file.txt',
      size: body.length,
    });
  });

  it('overwrites an existing file by default', async () => {
    await driver.upload({
      key: 'file.txt',
      body: Buffer.from('old content'),
    });

    const stored = await driver.upload({
      key: 'file.txt',
      body: Buffer.from('new content'),
    });

    await expect(
      fs.readFile(path.join(root, 'file.txt'), 'utf8'),
    ).resolves.toBe('new content');

    expect(stored).toEqual({
      key: 'file.txt',
      size: 'new content'.length,
    });
  });

  it('throws when uploading an existing file with overwrite disabled', async () => {
    await driver.upload({
      key: 'file.txt',
      body: Buffer.from('old content'),
    });

    await expect(
      driver.upload(
        {
          key: 'file.txt',
          body: Buffer.from('new content'),
        },
        { overwrite: false },
      ),
    ).rejects.toBeInstanceOf(AlreadyExistsError);

    await expect(
      fs.readFile(path.join(root, 'file.txt'), 'utf8'),
    ).resolves.toBe('old content');
  });

  it('downloads an existing file', async () => {
    await driver.upload({
      key: 'downloads/file.txt',
      body: Buffer.from('download content'),
    });

    const stream = await driver.download('downloads/file.txt');

    await expect(streamToBuffer(stream)).resolves.toEqual(
      Buffer.from('download content'),
    );
  });

  it('deletes an existing file', async () => {
    await driver.upload({
      key: 'file-to-delete.txt',
      body: Buffer.from('content'),
    });

    await driver.delete('file-to-delete.txt');

    await expect(
      fs.access(path.join(root, 'file-to-delete.txt')),
    ).rejects.toThrow();
  });

  it('checks whether a file exists', async () => {
    await expect(driver.exists('missing.txt')).resolves.toBe(false);

    await driver.upload({
      key: 'existing.txt',
      body: Buffer.from('content'),
    });

    await expect(driver.exists('existing.txt')).resolves.toBe(true);
  });

  it('returns file metadata', async () => {
    const beforeUpload = Date.now();

    await driver.upload({
      key: 'metadata/file.txt',
      body: Buffer.from('metadata content'),
    });

    const metadata = await driver.stat('metadata/file.txt');

    expect(metadata.key).toBe('metadata/file.txt');
    expect(metadata.size).toBe('metadata content'.length);
    expect(metadata.lastModified).toBeInstanceOf(Date);
    expect(metadata.lastModified?.getTime()).toBeGreaterThanOrEqual(
      beforeUpload,
    );
  });

  it('rejects keys outside of the storage root', async () => {
    await expect(
      driver.upload({
        key: '../outside.txt',
        body: Buffer.from('content'),
      }),
    ).rejects.toThrow('Invalid storage key');

    await expect(driver.exists('../outside.txt')).resolves.toBe(false);
  });
});
