import { createClient } from 'redis'
import type RedisConfig from './RedisConfig'

export type RedisClientType = ReturnType<typeof createClient>

/**
 * RedistClientFactory is a utility class for creating and managing Redis clients.
 */
export class RedisClientFactory {
  private static readonly clients: Record<string, RedisClientType> = {}

  /**
   * Create a Redis client for the specified context. If a client for the given context name
   * already exists, it will be reused.
   *
   * @param contextName - The name of the Redis client context.
   * @param config - The Redis configuration for the client.
   * @returns - A promise that resolves to the Redis client.
   */
  public static async createClient(
    contextName: string,
    config: RedisConfig
  ): Promise<RedisClientType> {
    let client = RedisClientFactory.getClient(contextName)

    if (client == null) {
      client = await RedisClientFactory.create(config)
      await RedisClientFactory.connect(client)
      RedisClientFactory.registerClient(client, contextName)
    }

    if (!client.isReady) {
      await RedisClientFactory.connect(client)
    }
    return client
  }

  /**
   * Retrieve a Redis client for the specified context if it exists.
   *
   * @param contextName - The name of the Redis client context.
   * @returns - The redis client if it exists, or null if it hasn't been created.
   */
  private static getClient(contextName: string): RedisClientType | null {
    return RedisClientFactory.clients[contextName]
  }

  /**
   * Create a Redis client based on the provided configuration.
   *
   * @param config - The Redis configuration for the client.
   * @returns - A promise that resolves to the created Redis client.
   */
  private static async create(config: RedisConfig): Promise<RedisClientType> {
    const client = createClient({ url: config.url })
    return client
  }

  /**
   * Connect a Redis client if necessary.
   *
   * @param client - The Redis client to connect.
   */
  private static async connect(client: RedisClientType): Promise<void> {
    if (!client.isReady) {
      await client.connect()
    }
  }

  /**
   * Register a Redis client with the specified context name.
   *
   * @param client - The Redis client to register.
   * @param contextName - The name of the Redis client context.
   */
  private static registerClient(
    client: RedisClientType,
    contextName: string
  ): void {
    RedisClientFactory.clients[contextName] = client
  }
}
