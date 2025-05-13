// src/utils/nodePolyfills.js
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Polyfill explicite pour les streams
import { ReadableStream, WritableStream, TransformStream } from 'web-streams-polyfill';

if (typeof global.ReadableStream !== 'function') {
  global.ReadableStream = ReadableStream;
}
if (typeof global.WritableStream !== 'function') {
  global.WritableStream = WritableStream;
}
if (typeof global.TransformStream !== 'function') {
  global.TransformStream = TransformStream;
}

// Polyfill pour EventEmitter
import { EventEmitter } from 'events';
if (!global.EventEmitter) {
  global.EventEmitter = EventEmitter;
}