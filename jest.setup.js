/**
 * @fileoverview Jest Setup Configuration
 * @source boombox-10.0/jest.setup.js
 * @refactor Added testing library setup and console mocking
 */

import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Mock console methods to reduce noise in test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = (...args) => {
  // Suppress environment validation messages in tests
  if (args[0]?.includes?.('Invalid environment variables') || 
      args[0]?.includes?.('Environment validation failed')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  // Suppress common warnings in test environment
  if (args[0]?.includes?.('Warning: ReactDOM.render is deprecated') ||
      args[0]?.includes?.('Warning: componentWillReceiveProps')) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Mock global objects commonly needed in tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});
