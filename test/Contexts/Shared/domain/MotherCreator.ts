import { faker, type Faker } from '@faker-js/faker'

/**
 * A utility class for creating random data using the Faker library.
 */
export class MotherCreator {
  /**
   * Generates and returns a Faker instance for creating random data.
   *
   * @returns A Faker instance for generating random data.
   */
  public static random(): Faker {
    return faker
  }
}
