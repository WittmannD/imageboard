import type { Readable } from 'node:stream';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  S3Client} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type {
  FileMetadata,
  ReadableStorage,
  SignedUrlOptions,
  SignedUrlStorage,
  StoredFile,
  UploadFile,
  UploadFileOptions,
  WritableStorage,
} from '../common/index.js';

export interface S3StorageDriverOptions {
  client: S3Client;
  bucket: string;
}

export class S3StorageDriver
  implements ReadableStorage, WritableStorage, SignedUrlStorage
{
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(options: S3StorageDriverOptions) {
    this.client = options.client;
    this.bucket = options.bucket;
  }

  async upload(
    file: UploadFile,
    options: UploadFileOptions = {},
  ): Promise<StoredFile> {
    const { overwrite = true } = options;

    const parallelUpload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: file.key,
        Body: file.body,
        ContentType: file.contentType,
        Metadata: file.metadata,
        IfNoneMatch: overwrite ? undefined : '*',
      },
    });

    let finalSizeInBytes = 0;
    parallelUpload.on('httpUploadProgress', (progress) => {
      if (progress.loaded) {
        finalSizeInBytes = progress.loaded;
      }
    });

    const result = await parallelUpload.done();

    return {
      key: file.key,
      etag: result.ETag,
      size: finalSizeInBytes,
    };
  }

  async download(key: string): Promise<Readable> {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    return result.Body as Readable;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      return true;
    } catch (e) {
      if (e instanceof NotFound) {
        return false;
      }

      throw e;
    }
  }

  async stat(key: string): Promise<FileMetadata> {
    const result = await this.client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    return {
      key,
      size: result.ContentLength ?? 0,
      contentType: result.ContentType,
      lastModified: result.LastModified,
      metadata: result.Metadata ?? {},
    };
  }

  async getSignedUrl(
    key: string,
    options: SignedUrlOptions = {},
  ): Promise<string> {
    return getSignedUrl(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.client,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      {
        expiresIn: options.expiresIn,
      },
    );
  }
}
