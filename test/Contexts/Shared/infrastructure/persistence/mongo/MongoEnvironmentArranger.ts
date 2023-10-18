import { type MongoClient } from 'mongodb'
import { EnvironmentArranger } from '../EnvironmentArranger'

/**
 * A class that arranges and cleans up a MongoDB environment
 * for testing or development purposes.
 */
export class MongoEnvironmentArranger extends EnvironmentArranger {
  constructor(private readonly _client: Promise<MongoClient>) {
    super()
  }

  /**
   * Arranges the MongoDB environment by cleaning the database,
   * removing data from all collections.
   */
  public async arrange(): Promise<void> {
    await this.cleanDatabase()
  }

  /**
   * Cleans the MongoDB database by deleting data from all collections.
   */
  protected async cleanDatabase(): Promise<void> {
    const collections = await this.collections()
    const client = await this.client()
    for (const collection of collections) {
      await client.db().collection(collection).deleteMany({})
    }
  }

  /**
   * Retrieves a list of collection names from the MongoDB database.
   *
   * @returns A promise that resolves to an array of collection names.
   */
  private async collections(): Promise<string[]> {
    const client = await this.client()
    const collections = await client
      .db()
      .listCollections(undefined, { nameOnly: true })
      .toArray()
    return collections.map((c) => c.name)
  }

  /**
   * Retrieves the MongoDB client for database access.
   *
   * @returns A promise that resolves to the MongoDB client.
   */
  protected async client(): Promise<MongoClient> {
    return await this._client
  }

  /**
   * Cleans up and closes the MongoDB environment.
   *
   * @returns A promise that resolves when the MongoDB environment has been
   * successfully closed.
   */
  public async close(): Promise<void> {
    await (await this.client()).close()
  }
}
