import { MongoClientFactory } from '@Shared/infrastructure/persistence/mongo/MongoClientFactory'
import { type MongoClient } from 'mongodb'

/**
 * A utility class for creating a MongoDB client instance for RabbitMQ integration testing.
 */
export class RabbitMQMongoClientMother {
  /**
   * Creates and returns a MongoDB client instance for RabbitMQ integration testing.
   *
   * @returns A connected MongoDB client instance.
   */
  public static async create(): Promise<MongoClient> {
    const client = await MongoClientFactory.createClient('shared', {
      url: 'mongodb://localhost:27017/mooc-backend-test'
    })
    return client
  }
}
