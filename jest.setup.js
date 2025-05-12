
// Mock global fetch for testing
global.fetch = jest.fn();

// Silence console errors during tests
console.error = jest.fn();
console.warn = jest.fn();
