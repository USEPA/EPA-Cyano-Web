export const environment = {
  appVersion: require('../../package.json').version + '-test',
	production: false,
	testing: true,
	userIdleSeconds: 3600,
	userIdleCountDownSeconds: 120,
	userIdlePingSeconds: 300,
	baseServerUrl: 'http://127.0.0.1:5050/cyan/app/api/'
};
