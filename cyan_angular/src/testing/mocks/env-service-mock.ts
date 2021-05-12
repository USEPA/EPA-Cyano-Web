export class MockEnvService {
  
  config: any = {
    baseServerUrl: 'http://testurl/'
  };

  getHeaders() {
    return "";
  }
}