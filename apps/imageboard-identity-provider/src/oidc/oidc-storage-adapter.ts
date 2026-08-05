import type Keyv from 'keyv';
import type { Adapter, AdapterPayload } from 'oidc-provider';

// TODO: restrict the authorization server to only statically configured clients
//  and disable dynamic registration. Configure the adapter to return falsy values
//  for client lookup operations (e.g., return Promise.resolve()).

const grantable = new Set([
  'AccessToken',
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest',
]);

const consumable = new Set([
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest',
  'PushedAuthorizationRequest',
]);

function grantKeyFor(id: string) {
  return `grant:${id}`;
}

function userCodeKeyFor(userCode: string) {
  return `userCode:${userCode}`;
}

function uidKeyFor(uid: string) {
  return `uid:${uid}`;
}

interface ConsumableValue {
  payload: AdapterPayload;
  expiresAt: number;
  consumed?: number;
}

export const KeyvAdapterFactory =
  (keyv: Keyv) =>
    (name: string): Adapter => {
      /**
       * Returns key for oidc model
       * @param id
       * @private
       */
      const getKey = (id: string) => `${name}:${id}`;

      /**
       * Update or Create an instance of an oidc-provider model.
       *
       */
      async function upsert(
        id: string,
        payload: AdapterPayload,
        expiresIn: number,
      ): Promise<void> {
        const ttl = expiresIn ? expiresIn * 1000 : undefined;
        const expiresAt = Date.now() + expiresIn * 1000;

        const key = getKey(id);

        if (consumable.has(name)) {
          const value: ConsumableValue = {
            payload,
            expiresAt
          };

          await keyv.set(key, value, ttl);
        } else {
          await keyv.set(key, payload, ttl);
        }

        if (grantable.has(name) && payload.grantId) {
          const grantKey = grantKeyFor(payload.grantId);

          const keys = (await keyv.get<string[]>(grantKey)) ?? [];

          if (!keys.includes(key)) {
            keys.push(key);
          }

          await keyv.set(grantKey, keys, ttl);
        }

        if (payload.userCode) {
          await keyv.set(userCodeKeyFor(payload.userCode), id, ttl);
        }

        if (payload.uid) {
          await keyv.set(uidKeyFor(payload.uid), id, ttl);
        }
      }

      /**
       * Return previously stored instance of an oidc-provider model.
       *
       */
      async function find(
        id: string,
      ): Promise<AdapterPayload | undefined> {
        const key = getKey(id);

        const value = await keyv.get<unknown>(key);

        if (!value) {
          return undefined;
        }

        if (!consumable.has(name)) {
          return value as AdapterPayload;
        }

        const stored = value as ConsumableValue;

        return {
          ...stored.payload,
          ...(stored.consumed !== undefined
            ? { consumed: stored.consumed }
            : {}),
        };
      }

      /**
       * Return previously stored instance of Session by its uid reference property.
       */
      async function findByUid(
        uid: string,
      ): Promise<AdapterPayload | undefined> {
        const id = await keyv.get<string>(uidKeyFor(uid));

        if (!id) {
          return undefined;
        }

        return find(id);
      }

      /**
       * Return previously stored instance of DeviceCode by the end-user entered user code.
       * This method is only needed for the deviceFlow feature
       */
      async function findByUserCode(
        userCode: string,
      ): Promise<AdapterPayload | undefined> {
        const id = await keyv.get<string>(userCodeKeyFor(userCode));

        if (!id) {
          return undefined;
        }

        return find(id);
      }

      /**
       * Destroy/Drop/Remove a stored oidc-provider model. Future finds for this id should be fulfilled
       * with falsy values.
       */
      async function destroy(id: string): Promise<void> {
        await keyv.delete(getKey(id));
      }

      /**
       * Destroy/Drop/Remove a stored oidc-provider model by its grantId property reference.
       * Future finds for all tokens having this grantId value should be fulfilled with falsy values.
       */
      async function revokeByGrantId(
        grantId: string,
      ): Promise<void> {
        const grantKey = grantKeyFor(grantId);

        const keys =
          (await keyv.get<string[]>(grantKey)) ?? [];

        for (const key of keys) {
          await keyv.delete(key);
        }

        await keyv.delete(grantKey);
      }

      /**
       * Mark a stored oidc-provider model as consumed (not yet expired though!).
       * Future finds for this id should be fulfilled with an object containing additional property named "consumed"
       * with truthy value (timestamp, date, boolean, etc).
       */
      async function consume(id: string): Promise<void> {
        const key = getKey(id);

        const value = await keyv.get<ConsumableValue>(key);

        if (!value) {
          return;
        }
        const remaining = value.expiresAt - Date.now();
        value.consumed = Math.floor(Date.now() / 1000);

        if (remaining > 0) {
          await keyv.set(key, value, remaining);
        }
      }

      return {
        upsert,
        find,
        findByUid,
        findByUserCode,
        destroy,
        revokeByGrantId,
        consume,
      };
    };