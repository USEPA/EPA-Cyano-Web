export const environment = {
  appVersion: require('../../package.json').version + '-test',
	production: false,
	testing: true,
	baseServerUrl: 'http://127.0.0.1:5050/cyan/app/api/'
};
