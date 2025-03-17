// Polyfills for Node.js globals in the browser environment

// Global object polyfill
if (typeof window !== 'undefined' && typeof global === 'undefined') {
  (window as any).global = window;
}

// Process polyfill
if (typeof window !== 'undefined' && typeof (window as any).process === 'undefined') {
  (window as any).process = {
    env: {},
    nextTick: (fn: Function) => setTimeout(fn, 0),
    browser: true
  };
}

// Buffer polyfill
if (typeof window !== 'undefined' && typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = {
    isBuffer: () => false
  };
}

export default {}; 