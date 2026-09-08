import { calculateJwkThumbprint, exportJWK, generateKeyPair } from 'jose';
import type { JWK, JWKS } from 'oidc-provider';

import type { JwksEncryptionService } from './jwks-encryption.service.js';
import type { JwksKeyRepository } from './jwks-key.repository.js';

const SIGNING_ALG = 'RS256';

export interface JwksStore {
  /**
   * Returns the current signing keyset, generating and persisting one if
   * none exists yet.
   */
  getJwks(): Promise<JWKS>;
}

async function generateSigningKey(): Promise<JWK> {
  const { privateKey } = await generateKeyPair(SIGNING_ALG, { extractable: true });
  const jwk = await exportJWK(privateKey);

  jwk.alg = SIGNING_ALG;
  jwk.use = 'sig';
  jwk.kid = await calculateJwkThumbprint(jwk);

  return jwk;
}

export const JwksPostgresStoreFactory = (
  jwksKeyRepository: JwksKeyRepository,
  encryption: JwksEncryptionService,
): JwksStore => {
  async function load(): Promise<JWK[]> {
    const rows = await jwksKeyRepository.find({ order: { createdAt: 'DESC' } });

    return rows.map((row) => encryption.decrypt(row.encryptedJwk));
  }

  async function generateAndPersistSigningKey(): Promise<JWK> {
    const jwk = await generateSigningKey();

    const entity = jwksKeyRepository.create({
      kid: jwk.kid,
      alg: SIGNING_ALG,
      encryptedJwk: encryption.encrypt(jwk),
    });

    await jwksKeyRepository.save(entity);

    return jwk;
  }

  async function getJwks(): Promise<JWKS> {
    const existing = await load();

    if (existing.length) {
      return { keys: existing };
    }

    return { keys: [await generateAndPersistSigningKey()] };
  }

  return { getJwks };
};
