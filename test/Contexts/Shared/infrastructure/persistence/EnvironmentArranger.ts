/**
 * An abstract class representing an environment arranger for setting up
 * and cleaning up test or development environments.
 */
export abstract class EnvironmentArranger {
  /**
   * Arranges the environment, typically used for setting up or
   * initializing a test or development environment.
   */
  public abstract arrange(): Promise<void>

  /**
   * Closes and cleans up the environment, typically used for
   * tearing down or resetting a test or development environment.
   */
  public abstract close(): Promise<void>
}
