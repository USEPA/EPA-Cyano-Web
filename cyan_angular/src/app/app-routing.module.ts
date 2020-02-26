import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AccountComponent } from './account/account.component';
import { MyLocationsComponent } from './my-locations/my-locations.component';
import { LocationCompareComponent } from './location-compare/location-compare.component';
import { ConfigComponent } from './config/config.component';
import { LocationDetailsComponent } from './location-details/location-details.component';
import { LocationCompareDetailsComponent } from './location-compare-details/location-compare-details.component';
import { CoordinatesComponent } from './coordinates/coordinates.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { LatestImageComponent } from './latest-image/latest-image.component';

import { AuthGuardService } from './services/auth-guard.service';

const routes: Routes = [
    { path: 'account', component: AccountComponent },
    { path: 'mylocations', component: MyLocationsComponent, canActivate: [AuthGuardService] },
    { path: 'comparelocations', component: LocationCompareComponent, canActivate: [AuthGuardService] },
    { path: 'configs', component: ConfigComponent, canActivate: [AuthGuardService] },
    { path: 'locationdetails', component: LocationDetailsComponent, canActivate: [AuthGuardService] },
    { path: 'locationcomparedetails', component: LocationCompareDetailsComponent, canActivate: [AuthGuardService] },
    { path: 'coordinates', component: CoordinatesComponent, canActivate: [AuthGuardService] },
	{ path: 'notifications', component: NotificationsComponent, canActivate: [AuthGuardService] },
    { path: 'latestimage', component: LatestImageComponent, canActivate: [AuthGuardService] }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }