export const urlConstants = {
  BASE_URL: 'https://chat-dev.elevate-apis.shikshalokam.org',
  websocketUrl: 'wss://chat-dev.elevate-apis.shikshalokam.org/websocket',
  API_URLS: {
    GET_DIRECT_MESSAGES_LIST: '/api/v1/rooms.get',
    GET_USER_DETAILS_BY_USERNAME: '/api/v1/users.info?username=',
    GET_MY_PROFILE_DETAIL: '/api/v1/me',
    SUBSCRIPTION_GET: '/api/v1/subscriptions.get',
    LOAD_HISTORY: '/api/v1/method.call/loadHistory',
    SEND_MESSAGE: '/api/v1/method.call/sendMessage',
    ROOM_INFO: '/api/v1/rooms.info',
  },
};
