
import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input'; 
import { MatFormFieldModule } from '@angular/material/form-field';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Ng5SliderModule } from 'ng5-slider';
import { RouterTestingModule } from '@angular/router/testing';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { MeterComponent } from './app/meter/meter.component';
import { ChartsModule } from 'ng2-charts';

beforeAll(() => {

});

afterAll(() => {

});

beforeEach(() => {
	TestBed.configureTestingModule({
		imports: [
			MatIconModule,
			MatFormFieldModule,
			MatInputModule,
			MatDialogModule,
			BrowserAnimationsModule,
			FormsModule,
			MatCheckboxModule,
			Ng5SliderModule,
			MatSelectModule,
			MatBadgeModule,
			MatTabsModule,
			MatCardModule,
			MatDatepickerModule,
			MatNativeDateModule,
			RouterTestingModule,
			ChartsModule
		],
		declarations: [
			MeterComponent
		]
	});
});

afterEach(() => {

});