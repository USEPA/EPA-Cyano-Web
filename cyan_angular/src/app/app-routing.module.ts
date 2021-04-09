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
import { ResetComponent } from './reset/reset.component';
import { CommentsComponent } from './comments/comments.component';
import { LocationSearchComponent } from './location-search/location-search.component';
import { WaterbodyStatsComponent } from './waterbody-stats/waterbody-stats.component';

import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
	{ path: 'account', component: AccountComponent },
	{ path: 'reset', component: ResetComponent },
	{ path: 'mylocations', component: MyLocationsComponent, canActivate: [AuthGuard] },
	{ path: 'comparelocations', component: LocationCompareComponent, canActivate: [AuthGuard] },
	{ path: 'configs', component: ConfigComponent, canActivate: [AuthGuard] },
	{ path: 'locationdetails', component: LocationDetailsComponent, canActivate: [AuthGuard] },
	{ path: 'locationcomparedetails', component: LocationCompareDetailsComponent, canActivate: [AuthGuard] },
	{ path: 'coordinates', component: CoordinatesComponent, canActivate: [AuthGuard] },
	{ path: 'notifications', component: NotificationsComponent, canActivate: [AuthGuard] },
	{ path: 'latestimage', component: LatestImageComponent, canActivate: [AuthGuard] },
	{ path: 'comments', component: CommentsComponent, canActivate: [AuthGuard] },
	{ path: 'search', component: LocationSearchComponent, canActivate: [AuthGuard]},
	{ path: 'wbstats', component: WaterbodyStatsComponent, canActivate: [AuthGuard]}
];

@NgModule({
  imports: [ RouterModule.forRoot(routes)],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }