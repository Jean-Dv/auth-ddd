import { MongoClient } from 'mongodb'
import type MongoConfig from './MongoConfig'

/**
 * This class is a factory that creates and registers a mongo mongo client
 * for each context name. This way, we can have multiple connections to
 * different databases.
 */
export class MongoClientFactory {
  private static readonly clients: Record<string, MongoClient> = {}

  /**
   * Creates a mongo client and registers it if doesn't exist.
   *
   * @param {string} contextName - The name of the context to create the client.
   * @param {MongoConfig} config - The configuration to create the client.
   * @returns {Promise<MongoClient>} - The mongo client.
   */
  static async createClient(
    contextName: string,
    config: MongoConfig
  ): Promise<MongoClient> {
    let client = MongoClientFactory.getClient(contextName)

    if (client == null) {
      client = await MongoClientFactory.createAndConnectClient(config)
      MongoClientFactory.registerClient(client, contextName)
    }
    return client
  }

  /**
   * Gets a mongo client by context name.
   *
   * @param {string} contextName - The name of the context to get the client.
   * @returns {MongoClient | null} - The mongo client or null.
   */
  private static getClient(contextName: string): MongoClient | null {
    return MongoClientFactory.clients[contextName]
  }

  /**
   * Creates and connects a mongo client.
   *
   * @param {MongoConfig} config - The configuration for the client.
   * @returns {MongoClient} - The mongo client.
   */
  private static async createAndConnectClient(
    config: MongoConfig
  ): Promise<MongoClient> {
    const client = new MongoClient(config.url, { ignoreUndefined: true })
    await client.connect()
    return client
  }

  /**
   * Registers a mongo client by context name.
   *
   * @param {MongoClient} client - The mongo client to register.
   * @param {string} contextName - The name of the context to register the client.
   * @returns {void}
   */
  private static registerClient(
    client: MongoClient,
    contextName: string
  ): void {
    MongoClientFactory.clients[contextName] = client
  }
}
