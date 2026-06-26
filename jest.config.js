module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.+(ts|js)', '**/?(*.)+(spec|test).+(ts|js)'],
  testPathIgnorePatterns: ['/node_modules/', '/src/scripts/'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
