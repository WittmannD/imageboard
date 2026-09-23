import {
  ParseFilePipeBuilder,
  UnprocessableEntityException,
} from '@nestjs/common';

import { ErrorCode } from '../errors/error-code.js';

export const ParseImageFilePipe = (
  allowedFormats: string[],
  sizeLimit: number,
) =>
  new ParseFilePipeBuilder()
    .addFileTypeValidator({
      fileType: allowedFormats.length
        ? new RegExp(`^image\\/(${allowedFormats.join('|')})$`)
        : /^image\/.*$/,
    })
    .addMaxSizeValidator({ maxSize: sizeLimit })
    .build({
      exceptionFactory: (error) =>
        new UnprocessableEntityException({
          message: error,
          errorCode: ErrorCode.InvalidImageFormat,
        }),
    });
