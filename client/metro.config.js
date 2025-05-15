// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.extraNodeModules = {
  stream: require.resolve('stream-browserify'),
  crypto: require.resolve('crypto-browserify'),
  http: require.resolve('@tradle/react-native-http'),
  https: require.resolve('https-browserify'),
  os: require.resolve('os-browserify/browser'),
  path: require.resolve('path-browserify'),
  fs: require.resolve('react-native-level-fs'),
  zlib: require.resolve('browserify-zlib'),
  net: require.resolve('react-native-tcp'),
  tls: require.resolve('react-native-tcp'),
  constants: require.resolve('constants-browserify'),
  dgram: null,
  'process/browser': require.resolve('process/browser'),
  process: require.resolve('process/browser'),
  url: require.resolve('url'),
  buffer: require.resolve('buffer'),
  events: require.resolve('events'),
};

module.exports = defaultConfig;