// src/api/index.js
import * as userApi from './userApi';
import * as friendsApi from './friendsApi';
import * as messageApi from './messageApi';
import * as groupApi from './groupApi';
import * as storageApi from './storageApi';
import * as geoApi from './geoApi';

export default {
  user: userApi,
  friends: friendsApi,
  messages: messageApi,
  groups: groupApi,
  storage: storageApi,
  geo: geoApi
};