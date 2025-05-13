export default {
  preset: 'ts-jest',
  // Enable ESM transformations and ts-jest ESM mode
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true }]
  },
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig.json'
    }
  },
  // Transform ESM packages in node_modules for @noble
  transformIgnorePatterns: [
    'node_modules/(?!(?:@noble/hashes|@noble/curves|@noble/secp256k1)/)'
  ],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
