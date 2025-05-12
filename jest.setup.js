
// Mock global fetch for testing
global.fetch = jest.fn();

// Silence console errors during tests
console.error = jest.fn();
console.warn = jest.fn();

// Add jest globals to fix TypeScript errors
global.describe = describe;
global.test = test;
global.expect = expect;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.jest = jest;
