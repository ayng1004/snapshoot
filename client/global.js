// global.js
import { Buffer } from 'buffer';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { TextEncoder, TextDecoder } from 'text-encoding';

// Polyfills globaux
global.Buffer = Buffer;
global.process = require('process');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Désactiver les avertissements pour XMLHttpRequest
global.XMLHttpRequest = global.originalXMLHttpRequest || global.XMLHttpRequest;

// Pour éviter les fuites de mémoire
global.Blob = global.originalBlob || global.Blob;
global.FileReader = global.originalFileReader || global.FileReader;