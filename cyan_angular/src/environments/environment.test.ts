export const environment = {
  appVersion: require('../../package.json').version + '-test',
	production: false,
	testing: true,
	userIdleSeconds: 3600,
	userIdleCountDownSeconds: 120,
	userIdlePingSeconds: 300
};
