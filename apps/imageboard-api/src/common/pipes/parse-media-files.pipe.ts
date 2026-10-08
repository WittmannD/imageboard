import {
  BadRequestException,
  PayloadTooLargeException,
  type PipeTransform,
  UnprocessableEntityException,
} from '@nestjs/common';

import { ErrorCode } from '../errors/error-code.js';
import { httpError } from '../errors/error-mapping.js';

export interface MediaFileRule {
  // subtypes of the mime type, e.g. jpeg for image/jpeg; any when empty
  formats: string[];
  sizeLimit: number;
}

export interface MediaFileRules {
  image: MediaFileRule;
  video: MediaFileRule;
}

function matches(type: 'image' | 'video', rule: MediaFileRule) {
  const subtype = rule.formats.length ? `(${rule.formats.join('|')})` : '.+';
  return new RegExp(`^${type}\\/${subtype}$`);
}

/**
 * Validates uploads that may mix images and videos, each against the formats
 * and size limit of its own kind. Like ParseFilePipe with disk storage, it
 * goes by the mime type the client sent; the gallery pipeline rejects a file
 * whose content is not what it claims when it reads its dimensions.
 */
export class ParseMediaFilesPipe implements PipeTransform<
  Express.Multer.File[] | undefined,
  Express.Multer.File[]
> {
  private readonly patterns: [RegExp, MediaFileRule][];

  constructor(rules: MediaFileRules) {
    this.patterns = [
      [matches('image', rules.image), rules.image],
      [matches('video', rules.video), rules.video],
    ];
  }

  transform(files: Express.Multer.File[] | undefined): Express.Multer.File[] {
    if (!files?.length) {
      throw httpError(
        BadRequestException,
        ErrorCode.FileRequired,
        'File is required',
      );
    }

    for (const file of files) {
      const rule = this.patterns.find(([pattern]) =>
        pattern.test(file.mimetype),
      )?.[1];

      if (!rule) {
        throw httpError(
          UnprocessableEntityException,
          ErrorCode.InvalidMediaFormat,
          `Unsupported file type ${file.mimetype}`,
        );
      }

      if (file.size > rule.sizeLimit) {
        throw httpError(
          PayloadTooLargeException,
          ErrorCode.FileTooLarge,
          `${file.originalname} exceeds the size limit of ${String(rule.sizeLimit)} bytes`,
        );
      }
    }

    return files;
  }
}
