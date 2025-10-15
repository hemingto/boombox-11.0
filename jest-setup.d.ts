import '@testing-library/jest-dom';

// Mock ResizeObserver for Jest tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
