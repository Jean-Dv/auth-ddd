import { RabbitMQConnection } from '@Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConnection'

/**
 * A double class that extends the `RabbitMQConnection` class for testing
 * or mocking purposes.
 *
 * This class inherits the behavior of `RabbitMQConnection` and can be
 * used in testing scenarios where you need a double or mock implementation
 * of the RabbitMQ connection.
 */
export class RabbitMQConnectionDouble extends RabbitMQConnection {}
