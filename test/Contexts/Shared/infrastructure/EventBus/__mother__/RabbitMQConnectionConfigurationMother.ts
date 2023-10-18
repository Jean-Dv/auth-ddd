import { type ConnectionSettings } from '@Shared/infrastructure/EventBus/RabbitMQ/ConnectionSettings'
import { type ExchangeSettings } from '@Shared/infrastructure/EventBus/RabbitMQ/ExchangeSettings'

/**
 * A utility class for creating RabbitMQ connection configuration for
 * testing or setup purposes.
 */
export class RabbitMQConnectionConfigurationMother {
  /**
   * Creates and returns a configuration object for RabbitMQ connection and
   * exchange settings.
   *
   * @returns An object containing RabbitMQ connection and exchange settings.
   */
  public static create(): {
    connectionSettings: ConnectionSettings
    exchangeSettings: ExchangeSettings
  } {
    return {
      connectionSettings: {
        username: 'guest',
        password: 'guest',
        vhost: '/',
        connection: {
          secure: false,
          hostname: 'localhost',
          port: 5672
        }
      },
      exchangeSettings: { name: '' }
    }
  }
}
