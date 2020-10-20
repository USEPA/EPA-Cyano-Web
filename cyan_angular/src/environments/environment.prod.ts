export const environment = {
  appVersion: require('../../package.json').version,
  production: true,
  testing: false,
  userIdleSeconds: 3600,
  userIdleCountDownSeconds: 120,
  userIdlePingSeconds: 300,
  baseServerUrl: '/cyan/app/api/',
  tomcatApiUrl: '/cyan/cyano'
};
