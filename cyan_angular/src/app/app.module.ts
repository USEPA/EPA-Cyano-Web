import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injector } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { createCustomElement } from '@angular/elements';
import {
  MatSelectModule,
  MatCheckboxModule,
  MatButtonModule,
  MatSliderModule,
  MatNativeDateModule,
  MatInputModule,
  MatTabsModule,
  MatBottomSheetModule,
  MatIconModule,
  MatBadgeModule,
  MatCardModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatDatepickerModule,
  MatMenuModule,
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material';
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

import { AppRoutingModule } from './app-routing.module';

import { LocationService } from './services/location.service';
import { MapService } from './services/map.service';
import { AuthService } from './services/auth.service';
import { CyanMap } from './utils/cyan-map';
import { MapPopupComponent } from './map-popup/map-popup.component';
import { Location } from './models/location';
import { ConfigComponent } from './config/config.component';
import { LocationDetailsComponent, LocationDetailsNotes } from './location-details/location-details.component';
import { AccountComponent } from './account/account.component';
// import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { LocationCompareDetailsComponent } from './location-compare-details/location-compare-details.component';
import { CoordinatesComponent } from './coordinates/coordinates.component';
import { LatestImageComponent } from './latest-image/latest-image.component';
import { BottomMenuComponent } from './bottom-menu/bottom-menu.component';
import { ResetComponent } from './reset/reset.component';

// import { AuthInterceptor, JwtInterceptor, LoaderInterceptor } from './interceptors';
import { AuthInterceptor, JwtInterceptor } from './interceptors';
import { AuthGuard } from './guards/auth.guard';

import { LoaderComponent } from './shared/loader/loader.component';
import { LoaderService } from './services/loader.service';
import { CommentsComponent } from './comments/comments.component';
import { AddComment, CommentAdded } from './comments/add-comment.component';
import { ViewComment, ViewImage } from './comments/view-comment.component';
import { MeterComponent } from './meter/meter.component';

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
    CommentAdded,
    MeterComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    LeafletModule.forRoot(),
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
    Ng5SliderModule,
    BrowserAnimationsModule,
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
    { provide: MatDialogRef, useValue: {} },
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    MapPopupComponent,
    LocationDetailsNotes,
    NotificationDetails,
    LocationCompareAlert,
    ViewComment,
    AddComment,
    ViewImage,
    CommentAdded
  ]
})
export class AppModule {
  constructor(private injector: Injector) {
    const PopupElement = createCustomElement(MapPopupComponent, { injector });
    customElements.define('popup-element', PopupElement);
  }
}
