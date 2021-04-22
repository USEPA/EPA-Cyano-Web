import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EnvService {

  config: any;
  retries: number = 0;  // retry counter
  allowedRetries: number = 1;

  hideEnvs: string[] = ['epa_aws_stg', 'epa_aws_prd'];  // envs to hide a given feature
  hideFeature: boolean = false;

  private envNameSubject =  new BehaviorSubject<boolean>(false);
  envNameObserverable = this.envNameSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadConfig() {
    console.log("Loading runtime configuration.");
    this.setConfig("./assets/env.json");
  }

  setConfig(configFile) {
    if (this.retries > this.allowedRetries) { return; }
    return this.http
      .get(configFile)
      .toPromise()
      .then(config => {
        this.config = config;
        console.log("Loaded config: ")
        console.log(config);
        this.hideFeatureCheck();
      })
      .catch(err => {
        console.log("Runtime envivornment not found. Loading default envivornment instead.");
        this.retries += 1;
        this.setConfig("./assets/default-env.json");
      });
  }

  hideFeatureCheck() {
    /*
    Hides a given feature based on
    deployment environment.
    */
    if (this.hideEnvs.includes(this.config['envName'])) {
      this.envNameSubject.next(true);
    }
    else {
      this.envNameSubject.next(false);
    }
  }

}
