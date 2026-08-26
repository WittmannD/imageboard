import type { OutgoingResponse, WritePacket } from '@nestjs/microservices';
import { RedisContext, Server } from '@nestjs/microservices';
import { createClient } from '@redis/client';

import type { RedisTransportOptions } from '../interfaces/redis-transport-options.interface.js';

type RedisClient = ReturnType<typeof createClient>;

const REDIS_DEFAULT_HOST = 'localhost';
const REDIS_DEFAULT_PORT = 6379;

/**
 * NestJS microservices server strategy backed by @redis/client, replicating
 * the wire protocol of the built-in ioredis-based Transport.REDIS strategy
 * (request published to the pattern channel, reply published to
 * `${pattern}.reply`) so it is a drop-in behavioral replacement.
 */
export class RedisTransportServer extends Server {
  protected subClient?: RedisClient;
  protected pubClient?: RedisClient;
  private isManuallyClosed = false;

  constructor(private readonly options: RedisTransportOptions = {}) {
    super();
    this.initializeSerializer(options);
    this.initializeDeserializer(options);
  }

  public override listen(callback: (err?: unknown) => void): void {
    try {
      const subClient = this.createRedisClient();
      const pubClient = this.createRedisClient();
      this.subClient = subClient;
      this.pubClient = pubClient;
      this.registerErrorListener(subClient);
      this.registerErrorListener(pubClient);
      this.start(subClient, pubClient, callback);
    } catch (err) {
      callback(err);
    }
  }

  private start(
    subClient: RedisClient,
    pubClient: RedisClient,
    callback: (err?: unknown) => void,
  ): void {
    void Promise.all([subClient.connect(), pubClient.connect()])
      .then(() => this.bindEvents(subClient, pubClient))
      .then(() => {
        callback();
      })
      .catch(callback);
  }

  private async bindEvents(
    subClient: RedisClient,
    pubClient: RedisClient,
  ): Promise<void> {
    const patterns = [...this.messageHandlers.keys()];

    await Promise.all(
      patterns.map((pattern) =>
        subClient.subscribe(this.getRequestPattern(pattern), (message) => {
          void this.handleMessage(message, pubClient, pattern);
        }),
      ),
    );
  }

  public override async close(): Promise<void> {
    this.isManuallyClosed = true;
    await Promise.all([this.pubClient?.close(), this.subClient?.close()]);
    this.pubClient = undefined;
    this.subClient = undefined;
  }

  private createRedisClient(): RedisClient {
    return createClient({
      socket: {
        host: this.options.host ?? REDIS_DEFAULT_HOST,
        port: this.options.port ?? REDIS_DEFAULT_PORT,
        reconnectStrategy: (retries) => this.createRetryStrategy(retries),
      },
    });
  }

  private async handleMessage(
    raw: string,
    pub: RedisClient,
    pattern: string,
  ): Promise<void> {
    const rawMessage = this.parseMessage(raw);
    const packet = await this.deserializer.deserialize(rawMessage, {
      channel: pattern,
    });
    const redisCtx = new RedisContext([pattern]);
    if (!('id' in packet)) {
      await this.handleEvent(pattern, packet, redisCtx);
      return;
    }

    const publish = this.getPublisher(pub, pattern, packet.id);
    const handler = this.getHandlerByPattern(pattern);
    if (!handler) {
      const noHandlerPacket: OutgoingResponse = {
        id: packet.id,
        status: 'error',
        err: `There is no matching message handler defined in the remote service. Event pattern: ${pattern}`,
      };
      publish(noHandlerPacket);
      return;
    }

    const response$ = this.transformToObservable(
      await handler(packet.data, redisCtx),
    );
    this.send(response$, publish);
  }

  private getPublisher(
    pub: RedisClient,
    pattern: string,
    id: string,
  ): (response: WritePacket) => void {
    return (response: WritePacket) => {
      const outgoingResponse: OutgoingResponse = { ...response, id };
      const serialized = this.serializer.serialize(outgoingResponse);
      void pub.publish(
        this.getReplyPattern(pattern),
        JSON.stringify(serialized),
      );
    };
  }

  private parseMessage(content: string): Record<string, unknown> {
    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch {
      return content as unknown as Record<string, unknown>;
    }
  }

  public getRequestPattern(pattern: string): string {
    return `${this.options.keyPrefix ?? ''}${pattern}`;
  }

  public getReplyPattern(pattern: string): string {
    return `${this.options.keyPrefix ?? ''}${pattern}.reply`;
  }

  private registerErrorListener(client: RedisClient): void {
    client.on('error', (err: Error) => {
      this.logger.error(err);
    });
  }

  private createRetryStrategy(retries: number): number | false {
    if (this.isManuallyClosed) {
      return false;
    }
    if (!this.options.retryAttempts) {
      this.logger.error(
        'Redis connection closed and retry attempts not specified',
      );
      return false;
    }
    if (retries > this.options.retryAttempts) {
      this.logger.error('Retry time exhausted');
      return false;
    }
    return this.options.retryDelay ?? 5000;
  }

  // Overriding the base class's generic `unwrap<T>()` contract requires
  // matching its (single-use) type parameter.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  public override unwrap<T>(): T {
    if (!this.pubClient || !this.subClient) {
      throw new Error(
        'Not initialized. Please call the "listen"/"startAllMicroservices" method before accessing the server.',
      );
    }
    return [this.pubClient, this.subClient] as unknown as T;
  }

  // Overriding the base class's generic `on(event, callback)` contract
  // requires matching its (single-use) type parameters and `Function` type.
  /* eslint-disable @typescript-eslint/no-unnecessary-type-parameters, @typescript-eslint/no-unsafe-function-type */
  public override on<
    EventKey extends string = string,
    EventCallback extends Function = Function,
  >(event: EventKey, callback: EventCallback): void {
    /* eslint-enable @typescript-eslint/no-unnecessary-type-parameters, @typescript-eslint/no-unsafe-function-type */
    const listener = callback as unknown as (...args: unknown[]) => void;
    this.subClient?.on(event, listener);
    this.pubClient?.on(event, listener);
  }
}
