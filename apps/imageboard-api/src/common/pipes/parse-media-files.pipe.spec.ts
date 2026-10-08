import { HttpException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { ParseMediaFilesPipe } from './parse-media-files.pipe.js';

const pipe = new ParseMediaFilesPipe({
  image: { formats: ['jpeg', 'png'], sizeLimit: 100 },
  video: { formats: ['mp4', 'quicktime'], sizeLimit: 1000 },
});

const file = (mimetype: string, size: number) =>
  ({ mimetype, size, originalname: 'upload' }) as Express.Multer.File;

function errorOf(files: Express.Multer.File[] | undefined) {
  try {
    pipe.transform(files);
  } catch (error) {
    if (error instanceof HttpException) {
      return {
        status: error.getStatus(),
        errorCode: (error.getResponse() as { errorCode: string }).errorCode,
      };
    }
    throw error;
  }
  throw new Error('expected the pipe to reject');
}

describe('ParseMediaFilesPipe', () => {
  it('accepts images and videos together', () => {
    const files = [file('image/jpeg', 100), file('video/mp4', 1000)];

    expect(pipe.transform(files)).toBe(files);
  });

  it('requires a file', () => {
    expect(errorOf(undefined)).toEqual({
      status: 400,
      errorCode: 'file_required',
    });
    expect(errorOf([])).toMatchObject({ errorCode: 'file_required' });
  });

  it('rejects formats outside the allowed ones', () => {
    expect(errorOf([file('image/gif', 1)])).toEqual({
      status: 422,
      errorCode: 'invalid_media_format',
    });
    expect(errorOf([file('video/x-matroska', 1)])).toMatchObject({
      errorCode: 'invalid_media_format',
    });
    expect(errorOf([file('application/pdf', 1)])).toMatchObject({
      errorCode: 'invalid_media_format',
    });
  });

  it('holds each file to the size limit of its kind', () => {
    // a video may be larger than an image may
    expect(errorOf([file('image/png', 101)])).toEqual({
      status: 413,
      errorCode: 'file_too_large',
    });
    expect(pipe.transform([file('video/quicktime', 101)])).toHaveLength(1);
    expect(errorOf([file('video/mp4', 1001)])).toMatchObject({
      errorCode: 'file_too_large',
    });
  });
});
