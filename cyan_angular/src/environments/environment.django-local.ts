export const environment = {
  appVersion: require('../../package.json').version + '-local',
  production: true,
  testing: false,
  userIdleSeconds: 3600,
  userIdleCountDownSeconds: 120,
  userIdlePingSeconds: 300,
  baseServerUrl: 'http://localhost:5001/cyan/app/api/'
};
