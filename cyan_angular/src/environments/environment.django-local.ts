export const environment = {
  appVersion: require('../../package.json').version + '-local',
  production: true,
  testing: false,
  baseServerUrl: 'http://localhost:5001/cyan/app/api/'
};
