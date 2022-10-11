import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EnvService {

  config: any;
  retries: number = 0;  // retry counter
  allowedRetries: number = 2;
  delay: number = 1000;  // units: seconds

  envFile: string = './assets/env.json';
  defaultEnvFile: string = './assets/default-env.json';

  // Indicates config has been set and is ready to use:
  private configSetSubject =  new BehaviorSubject<boolean>(false);
  configSetObservable = this.configSetSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadConfig() {
    console.log('Loading runtime configuration.');
    this.setConfig(this.envFile);
  }

  setConfig(configFile) {
    if (this.retries > this.allowedRetries) {
      console.log("Unable to load env file: ", this.envFile);
      return;
    }
    else {
      return this.http
        .get(configFile)
        .toPromise()
        .then(config => {
          this.config = config;
          console.log('Runtime environment loaded: ', config);
          this.configSetSubject.next(true);  // publishes that config has been set
        })
        .catch(err => {
          console.log('Runtime environment not found. Retrying.');
          this.retries += 1;
          setTimeout(() => {
            this.setConfig(this.envFile);
          }, this.delay);
        });
    }
  }

  getHeaders() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'App-Name': this.config.appName
      })
    };
  }

}
