// Add testing library jest-dom matchers
require('@testing-library/jest-dom');

// Mock global fetch for testing
global.fetch = jest.fn();

// Mock WebSocket for testing (jsdom)
class MockWebSocket {
  constructor(url) {}
  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
  set onopen(fn) {}
  set onerror(fn) {}
  set onclose(fn) {}
  set onmessage(fn) {}
  get readyState() { return MockWebSocket.OPEN; }
}
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSED = 3;
global.WebSocket = MockWebSocket;

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
