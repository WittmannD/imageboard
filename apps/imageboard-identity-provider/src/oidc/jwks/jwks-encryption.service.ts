import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JWK } from 'oidc-provider';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts/decrypts JWKS private key material at rest using a single
 * master key from JWKS_MASTER_ENCRYPTION_KEY (base64-encoded AES-256 key,
 * e.g. generated with `openssl rand -base64 32`).
 */
@Injectable()
export class JwksEncryptionService {
  private readonly masterKey: Buffer;

  constructor(configService: ConfigService) {
    const encoded = configService.getOrThrow<string>('jwksEncryptionKey');
    const key = Buffer.from(encoded, 'base64');

    if (key.length !== KEY_LENGTH) {
      throw new Error(
        `JWKS_ENCRYPTION_KEY must be a base64-encoded ${KEY_LENGTH}-byte AES-256 key, got ${key.length} bytes`,
      );
    }

    this.masterKey = key;
  }

  encrypt(jwk: JWK): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.masterKey, iv);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(jwk), 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
  }

  decrypt(payload: string): JWK {
    const raw = Buffer.from(payload, 'base64');
    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, this.masterKey, iv);
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return JSON.parse(plaintext.toString('utf8')) as JWK;
  }
}
