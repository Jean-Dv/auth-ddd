module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  cacheDirectory: '.tmp/jestCache',
  moduleNameMapper: {
    '@Shared/(.*)': '<rootDir>/src/Contexts/Shared/$1'
  }
}
