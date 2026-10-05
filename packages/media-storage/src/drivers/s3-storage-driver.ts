import type { Readable } from 'node:stream';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type {
  ObjectMetadata,
  ReadableStorage,
  SignedUrlOptions,
  SignedUrlStorage,
  StoredObject,
  UploadObject,
  UploadObjectOptions,
  WritableStorage,
} from '../common/index.js';

export interface S3StorageDriverOptions {
  client: S3Client;
  bucket: string;
  prefix?: string;
}

export class S3StorageDriver
  implements ReadableStorage, WritableStorage, SignedUrlStorage
{
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string | undefined;

  constructor({ client, bucket, prefix }: S3StorageDriverOptions) {
    this.client = client;
    this.bucket = bucket;
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix ?? ''}${key}`;
  }

  async upload(
    object: UploadObject,
    options: UploadObjectOptions = {},
  ): Promise<StoredObject> {
    const { overwrite = true } = options;

    const parallelUpload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: this.getKey(object.key),
        Body: object.body,
        ContentType: object.contentType,
        Metadata: object.metadata,
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
      key: this.getKey(object.key),
      etag: result.ETag,
      size: finalSizeInBytes,
    };
  }

  async download(key: string): Promise<Readable> {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.getKey(key),
      }),
    );

    return result.Body as Readable;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: this.getKey(key),
      }),
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.getKey(key),
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

  async stat(key: string): Promise<ObjectMetadata> {
    const result = await this.client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: this.getKey(key),
      }),
    );

    return {
      key: this.getKey(key),
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
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.getKey(key),
      }),
      {
        expiresIn: options.expiresIn,
      },
    );
  }
}
