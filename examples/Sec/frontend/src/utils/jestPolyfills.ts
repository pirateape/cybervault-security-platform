// Polyfills for Jest environment

// Use Node.js util module for TextEncoder/TextDecoder (recommended for Jest)
import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder as typeof global.TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

// TODO: For Blob, Headers, Request, Response, AbortSignal, prefer using 'node-fetch' or 'undici' for Jest polyfills.
// The following custom polyfills are commented out to avoid linter/type errors. Revisit as needed.
/*
// Blob polyfill
// if (typeof global.Blob === 'undefined') {
//   global.Blob = class Blob { /* ... *\/ };
// }
// File polyfill
// if (typeof global.File === 'undefined') {
//   global.File = class File extends global.Blob { /* ... *\/ };
// }
// Headers polyfill
// if (typeof global.Headers === 'undefined') {
//   global.Headers = class Headers { /* ... *\/ };
// }
// Request polyfill
// if (typeof global.Request === 'undefined') {
//   global.Request = class Request { /* ... *\/ };
// }
// Response polyfill
// if (typeof global.Response === 'undefined') {
//   global.Response = class Response { /* ... *\/ };
// }
// AbortController/AbortSignal polyfill
// if (typeof global.AbortController === 'undefined') {
//   global.AbortController = class AbortController { /* ... *\/ };
// }
// if (typeof global.AbortSignal === 'undefined') {
//   global.AbortSignal = class AbortSignal extends EventTarget { /* ... *\/ };
// }
*/

// performance.now polyfill
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByType: () => [],
    getEntriesByName: () => [],
    clearMarks: () => {},
    clearMeasures: () => {},
  } as any;
}
