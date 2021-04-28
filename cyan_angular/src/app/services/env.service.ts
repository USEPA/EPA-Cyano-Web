import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EnvService {

  config: any;
  retries: number = 0;  // retry counter
  allowedRetries: number = 1;

  // Indicates config has been set and is ready to use:
  private configSetSubject =  new Subject<boolean>();
  configSetObservable = this.configSetSubject.asObservable();

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
        this.configSetSubject.next(true);  // publishes that config has been set
      })
      .catch(err => {
        console.log("Runtime envivornment not found. Loading default envivornment instead.");
        this.retries += 1;
        this.setConfig("./assets/default-env.json");
      });
  }

}
