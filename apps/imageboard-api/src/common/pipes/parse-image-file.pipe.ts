import {
  BadRequestException,
  ParseFilePipeBuilder,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { ErrorCode } from '../errors/error-code.js';
import { httpError } from '../errors/error-mapping.js';

// ParseFilePipe reports every failure as a message string; tell them apart by
// the wording of Nest's built-in validators
function toImageFileException(error: string) {
  if (error === 'File is required') {
    return httpError(BadRequestException, ErrorCode.FileRequired, error);
  }

  if (error.includes('expected size')) {
    return httpError(PayloadTooLargeException, ErrorCode.FileTooLarge, error);
  }

  return httpError(
    UnprocessableEntityException,
    ErrorCode.InvalidImageFormat,
    error,
  );
}

export const ParseImageFilePipe = (allowedFormats: string[], sizeLimit: number) =>
  new ParseFilePipeBuilder()
    .addFileTypeValidator({
      fallbackToMimetype: true,
      fileType: allowedFormats.length
        ? new RegExp(`^image\\/(${allowedFormats.join('|')})$`)
        : /^image\/.*$/,
    })
    .addMaxSizeValidator({ maxSize: sizeLimit })
    .build({ exceptionFactory: toImageFileException });
