import type { MsPattern, ReadPacket, WritePacket } from '@nestjs/microservices';
import { ClientProxy } from '@nestjs/microservices';
import { createClient } from '@redis/client';

import type { RedisTransportOptions } from '../interfaces/redis-transport-options.interface.js';

type RedisClient = ReturnType<typeof createClient>;
type ResponseCallback = (packet: WritePacket) => void;

const REDIS_DEFAULT_HOST = 'localhost';
const REDIS_DEFAULT_PORT = 6379;

/**
 * NestJS microservices client proxy backed by @redis/client, replicating
 * the wire protocol of the built-in ioredis-based Transport.REDIS strategy
 * (request published to the pattern channel, reply published to
 * `${pattern}.reply`) so it is a drop-in behavioral replacement.
 */
export class RedisTransportClient extends ClientProxy {
  protected pubClient?: RedisClient;
  protected subClient?: RedisClient;
  private readonly subscriptionsCount = new Map<string, number>();
  private connectionPromise?: Promise<unknown>;
  private isManuallyClosed = false;

  constructor(private readonly options: RedisTransportOptions = {}) {
    super();
    this.initializeSerializer(options);
    this.initializeDeserializer(options);
  }

  public async connect(): Promise<unknown> {
    if (this.pubClient && this.subClient) {
      return this.connectionPromise;
    }

    const pubClient = this.createClient();
    const subClient = this.createClient();
    this.pubClient = pubClient;
    this.subClient = subClient;
    this.registerErrorListener(pubClient);
    this.registerErrorListener(subClient);

    this.connectionPromise = Promise.all([
      pubClient.connect(),
      subClient.connect(),
    ]);
    await this.connectionPromise;
    return this.connectionPromise;
  }

  public async close(): Promise<void> {
    this.isManuallyClosed = true;
    await Promise.all([this.pubClient?.close(), this.subClient?.close()]);
    this.pubClient = undefined;
    this.subClient = undefined;
    this.subscriptionsCount.clear();
  }

  private createClient(): RedisClient {
    return createClient({
      socket: {
        host: this.options.host ?? REDIS_DEFAULT_HOST,
        port: this.options.port ?? REDIS_DEFAULT_PORT,
        reconnectStrategy: (retries) => this.createRetryStrategy(retries),
      },
    });
  }

  private registerErrorListener(client: RedisClient): void {
    client.on('error', (err: Error) => {
      this.handleError(err);
    });
  }

  private handleError(err: Error): void {
    if (this.routingMap.size > 0) {
      for (const callback of this.routingMap.values()) {
        (callback as ResponseCallback)({ err });
      }
      this.routingMap.clear();
    }
  }

  private createRetryStrategy(retries: number): number | false {
    if (this.isManuallyClosed) {
      return false;
    }
    if (!this.options.retryAttempts || retries > this.options.retryAttempts) {
      return false;
    }
    return this.options.retryDelay ?? 5000;
  }

  public getRequestPattern(pattern: string): string {
    return `${this.options.keyPrefix ?? ''}${pattern}`;
  }

  public getReplyPattern(pattern: string): string {
    return `${this.options.keyPrefix ?? ''}${pattern}.reply`;
  }

  protected publish(
    partialPacket: ReadPacket,
    callback: ResponseCallback,
  ): () => void {
    if (!this.pubClient || !this.subClient) {
      callback({ err: new Error('Redis client is not connected') });
      return () => {
        /* not connected, nothing to unsubscribe */
      };
    }
    const pubClient = this.pubClient;
    const subClient = this.subClient;

    try {
      const packet = this.assignPacketId(partialPacket);
      const pattern = this.normalizePattern(
        partialPacket.pattern as MsPattern,
      );
      const serializedPacket = this.serializer.serialize(packet);
      const responseChannel = this.getReplyPattern(pattern);

      const publishPacket = () => {
        const subscriptionsCount =
          this.subscriptionsCount.get(responseChannel) ?? 0;
        this.subscriptionsCount.set(responseChannel, subscriptionsCount + 1);
        this.routingMap.set(packet.id, callback);
        void pubClient.publish(
          this.getRequestPattern(pattern),
          JSON.stringify(serializedPacket),
        );
      };

      if ((this.subscriptionsCount.get(responseChannel) ?? 0) <= 0) {
        subClient
          .subscribe(responseChannel, (message) => {
            void this.handleResponse(message);
          })
          .then(publishPacket)
          .catch((err: unknown) => {
            callback({ err });
          });
      } else {
        publishPacket();
      }

      return () => {
        this.unsubscribeFromChannel(responseChannel);
        this.routingMap.delete(packet.id);
      };
    } catch (err) {
      callback({ err });
      return () => {
        /* publish failed before a subscription was created */
      };
    }
  }

  private async handleResponse(raw: string): Promise<void> {
    let packet: unknown;
    try {
      packet = JSON.parse(raw);
    } catch {
      packet = raw;
    }
    const { err, response, isDisposed, id } =
      await this.deserializer.deserialize(packet);
    const callback = this.routingMap.get(id) as ResponseCallback | undefined;
    if (!callback) {
      return;
    }
    if (isDisposed || err) {
      callback({ err, response, isDisposed: true });
      return;
    }
    callback({ err, response });
  }

  // Matches the base class's `dispatchEvent<T = any>(...): Promise<T>` contract.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async dispatchEvent<T = any>(packet: ReadPacket): Promise<T> {
    if (!this.pubClient) {
      throw new Error('Redis client is not connected');
    }
    const pattern = this.normalizePattern(packet.pattern as MsPattern);
    const serializedPacket = this.serializer.serialize(packet);
    const subscriberCount = await this.pubClient.publish(
      pattern,
      JSON.stringify(serializedPacket),
    );
    return subscriberCount as unknown as T;
  }

  private unsubscribeFromChannel(channel: string): void {
    const subscriptionCount = this.subscriptionsCount.get(channel) ?? 0;
    this.subscriptionsCount.set(channel, subscriptionCount - 1);
    if (subscriptionCount - 1 <= 0) {
      void this.subClient?.unsubscribe(channel);
    }
  }

  // Overriding the base class's generic `unwrap<T>()` contract requires
  // matching its (single-use) type parameter.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  public override unwrap<T>(): T {
    if (!this.pubClient || !this.subClient) {
      throw new Error(
        'Not initialized. Please call the "connect" method first.',
      );
    }
    return [this.pubClient, this.subClient] as unknown as T;
  }
}
