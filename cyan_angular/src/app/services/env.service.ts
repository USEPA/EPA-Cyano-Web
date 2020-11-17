import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EnvService {
  // config: Config;

  config: any;

  constructor(private http: HttpClient) {}

  loadConfig() {
    return this.http
      .get('./assets/configs/runtime-env.json')
      .toPromise()
      .then(config => {
        this.config = config;
      });
  }
}


// export enum Environment {
//   Prod = 'prod',
//   Staging = 'staging',
//   Test = 'test',
//   Dev = 'dev',
//   Local = 'local',
// }

// interface Configuration {
//   apiUrl: string;
//   stage: Environment;
// }

// @Injectable({ providedIn: 'root' })
// export class EnvService {
//   // private readonly apiUrl = 'http://localhost:4200';
//   private readonly configUrl = 'assets/config/runtime-env.json';  // TODO: Would this work with QED deploy?
//   private configuration$: Observable<Configuration>;

//   constructor(private http: HttpClient) {}

//   public load(): Observable<Configuration> {

//     console.log("Loading runtime environment.");

//     if (!this.configuration$) {
//       this.configuration$ = this.http
//         .get<Configuration>(`${this.configUrl}`)
//         .pipe(shareReplay(1));  // caches reponse at runtime to reduce http requests (remove for dynamic env updates)
//     }
//     return this.configuration$;
//   }
// }