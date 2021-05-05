import { HttpHeaders } from '@angular/common/http';

export const headerOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    'App-Name': 'Cyanweb'
  })
};