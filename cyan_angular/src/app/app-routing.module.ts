import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AccountComponent } from './account/account.component';
import { MyLocationsComponent } from './my-locations/my-locations.component';
import { LocationCompareComponent } from './location-compare/location-compare.component';
import { ConfigComponent } from './config/config.component';
import { LocationDetailsComponent } from './location-details/location-details.component';

const routes: Routes = [
    { path: 'account', component: AccountComponent },
    { path: 'mylocations', component: MyLocationsComponent},
    { path: 'comparelocations', component: LocationCompareComponent},
    { path: 'configs', component: ConfigComponent},
    { path: 'locationdetails', component: LocationDetailsComponent}
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }