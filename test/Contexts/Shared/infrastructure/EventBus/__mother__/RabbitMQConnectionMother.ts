import { RabbitMQConnection } from '@Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConnection'
import { RabbitMQConnectionConfigurationMother } from './RabbitMQConnectionConfigurationMother'
import { RabbitMQConnectionDouble } from '../__mocks__/RabbitMQConnectionDouble'

/**
 * A utility class for creating RabbitMQ connections and connection
 * doubles for testing purposes.
 */
export class RabbitMQConnectionMother {
  /**
   * Creates and returns a RabbitMQ connection with the provided configuration.
   *
   * @returns A connected RabbitMQConnection instance.
   */
  public static async create(): Promise<RabbitMQConnection> {
    const config = RabbitMQConnectionConfigurationMother.create()
    const connection = new RabbitMQConnection(config)
    await connection.connect()
    return connection
  }

  /**
   * Creates and returns a RabbitMQ connection double (mock) for simulating failed publishes.
   *
   * @returns A RabbitMQConnectionDouble instance.
   */
  public static failOnPublish(): RabbitMQConnection {
    return new RabbitMQConnectionDouble(
      RabbitMQConnectionConfigurationMother.create()
    )
  }
}
