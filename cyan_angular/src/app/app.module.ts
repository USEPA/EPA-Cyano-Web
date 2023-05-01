import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injector, APP_INITIALIZER } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { createCustomElement } from '@angular/elements';
import {MatSelectModule } from '@angular/material/select'; 
import {MatCheckboxModule } from '@angular/material/checkbox'; 
import {MatButtonModule } from '@angular/material/button'; 
import {MatSliderModule } from '@angular/material/slider'; 
import {MatNativeDateModule } from '@angular/material/core';
import {MatInputModule } from '@angular/material/input'; 
import {MatTabsModule } from '@angular/material/tabs'; 
import {MatBottomSheetModule } from '@angular/material/bottom-sheet'; 
import {MatIconModule } from '@angular/material/icon'; 
import {MatBadgeModule } from '@angular/material/badge'; 
import {MatCardModule } from '@angular/material/card'; 
import {MatProgressBarModule } from '@angular/material/progress-bar'; 
import {MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 
import {MatDatepickerModule } from '@angular/material/datepicker'; 
import {MatMenuModule } from '@angular/material/menu'; 
import {MatDialogModule } from '@angular/material/dialog'; 
import {MatDialogRef } from '@angular/material/dialog'; 
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatTableModule } from '@angular/material/table';
import {MAT_DIALOG_DATA } from '@angular/material/dialog';
import {MatSidenavModule} from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { Ng5SliderModule } from 'ng5-slider';
import { JwtHelperService } from '@auth0/angular-jwt';

import { AppComponent } from './app.component';
import { MarkerMapComponent } from './marker-map/marker-map.component';
import { MyLocationsComponent } from './my-locations/my-locations.component';
import { HeaderComponent } from './header/header.component';
import { LinksLeftComponent } from './links-left/links-left.component';
import { FooterComponent } from './footer/footer.component';
import { LocationCompareComponent, LocationCompareAlert } from './location-compare/location-compare.component';
import { NotificationsComponent, NotificationDetails } from './notifications/notifications.component';

import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { ChartsModule } from 'ng2-charts';
import { UserIdleModule } from 'angular-user-idle';

import { AppRoutingModule } from './app-routing.module';

import { LocationService } from './services/location.service';
import { MapService } from './services/map.service';
import { AuthService } from './services/auth.service';
import { EnvService } from './services/env.service';

import { CyanMap } from './utils/cyan-map';
import { MapPopupComponent } from './map-popup/map-popup.component';
import { Location } from './models/location';
import { ConfigComponent, SaveDialogComponent } from './config/config.component';
import { LocationDetailsComponent, LocationDetailsNotes } from './location-details/location-details.component';
import { AccountComponent, WhatsNewDialog } from './account/account.component';
// import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { LocationCompareDetailsComponent } from './location-compare-details/location-compare-details.component';
import { CoordinatesComponent } from './coordinates/coordinates.component';
import { LatestImageComponent } from './latest-image/latest-image.component';
import { BottomMenuComponent } from './bottom-menu/bottom-menu.component';
import { ResetComponent } from './reset/reset.component';

import { AuthInterceptor, JwtInterceptor } from './interceptors';
import { AuthGuard } from './guards/auth.guard';

import { LoaderComponent } from './shared/loader/loader.component';
import { DialogComponent } from './shared/dialog/dialog.component';
import { LoaderService } from './services/loader.service';
import { CommentsComponent } from './comments/comments.component';
import { AddComment } from './comments/add-comment.component';
import { ViewComment, ViewImage } from './comments/view-comment.component';
import { MeterComponent } from './meter/meter.component';
import { SessionTimeoutComponent } from './session-timeout/session-timeout.component';
import { LocationSearchComponent } from './location-search/location-search.component';
import { BatchComponent } from './batch/batch.component';
import { WaterbodyStatsComponent } from './waterbody-stats/waterbody-stats.component';
import { WaterBodyStatsDetails } from './waterbody-stats/waterbody-stats-details.component';
import { Calculations } from './waterbody-stats/utils/calculations';
import { Charts } from './waterbody-stats/utils/charts';

import 'hammerjs';
import 'chartjs-plugin-zoom';
import 'chartjs-plugin-datalabels';
import { ReportsComponent } from './waterbody-stats/reports/reports.component';
import { ReportsResultsComponent } from './waterbody-stats/reports/reports-results.component';
import { MonthlyReportsComponent } from './waterbody-stats/monthly-reports/monthly-reports.component';

@NgModule({
    declarations: [
        AppComponent,
        MarkerMapComponent,
        MyLocationsComponent,
        HeaderComponent,
        LinksLeftComponent,
        FooterComponent,
        LocationCompareComponent,
        LocationCompareAlert,
        NotificationsComponent,
        NotificationDetails,
        MapPopupComponent,
        ConfigComponent,
        SaveDialogComponent,
        LocationDetailsComponent,
        LocationDetailsNotes,
        AccountComponent,
        LocationCompareDetailsComponent,
        CoordinatesComponent,
        LatestImageComponent,
        BottomMenuComponent,
        ResetComponent,
        LoaderComponent,
        CommentsComponent,
        ViewComment,
        AddComment,
        ViewImage,
        MeterComponent,
        DialogComponent,
        SessionTimeoutComponent,
        LocationSearchComponent,
        BatchComponent,
        WaterbodyStatsComponent,
        WaterBodyStatsDetails,
        ReportsComponent,
        ReportsResultsComponent,
        WhatsNewDialog,
        MonthlyReportsComponent
    ],
    imports: [
        BrowserModule,
        CommonModule,
        HttpClientModule,
        FormsModule,
        LeafletModule,
        // Optionally you can set time for `idle`, `timeout` and `ping` in seconds.
        // Default values: `idle` is 600 (10 minutes), `timeout` is 300 (5 minutes)
        // and `ping` is 120 (2 minutes).
        UserIdleModule.forRoot({
            idle: (environment.userIdleSeconds - environment.userIdleCountDownSeconds),
            timeout: environment.userIdleCountDownSeconds,
            ping: environment.userIdlePingSeconds
        }),
        AppRoutingModule,
        ChartsModule,
        MatMenuModule,
        MatSelectModule,
        MatCheckboxModule,
        MatButtonModule,
        MatSliderModule,
        MatInputModule,
        MatNativeDateModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatDatepickerModule,
        MatTabsModule,
        MatIconModule,
        MatBottomSheetModule,
        MatBadgeModule,
        MatCardModule,
        MatBadgeModule,
        MatDialogModule,
        MatToolbarModule,
        MatTableModule,
        MatSidenavModule,
        MatSortModule,
        MatGridListModule,
        MatListModule,
        MatSlideToggleModule,
        MatRadioModule,
        Ng5SliderModule,
        BrowserAnimationsModule
        // ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
    ],
    providers: [
        LoaderService,
        // { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
        LocationService,
        MapService,
        AuthService,
        CyanMap,
        Location,
        DatePipe,
        JwtHelperService,
        AuthGuard,
        AddComment,
        DialogComponent,
        CoordinatesComponent,
        WaterBodyStatsDetails,
        MarkerMapComponent,
        WaterbodyStatsComponent,
        Calculations,
        Charts,
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        {
            provide: APP_INITIALIZER,
            useFactory: (envService: EnvService) => () => envService.loadConfig(),
            deps: [EnvService],
            multi: true
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
  constructor(private injector: Injector) {
    const PopupElement = createCustomElement(MapPopupComponent, { injector });
    customElements.define('popup-element', PopupElement);
  }
}
