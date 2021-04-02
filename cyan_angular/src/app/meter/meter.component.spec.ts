import { SimpleChange } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from "@angular/router/testing";
import { SafeHtml, DomSanitizer, SafeValue } from "@angular/platform-browser";

import { MockLocation } from '../../testing/mocks/location';
import { LocationService } from '../services/location.service';
import { ConfigService } from '../services/config.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { MeterComponent } from './meter.component';

describe('MeterComponent', () => {

  let component: MeterComponent;
  let fixture: ComponentFixture<MeterComponent>;
  let testLocation: MockLocation = new MockLocation();
  let mockSimpleChange: SimpleChange = new SimpleChange(undefined, testLocation, true);
  let meterSpy;
  let conSpy;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        RouterTestingModule
      ],
      declarations: [ MeterComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    // MeterComponent.prototype.ngOnInit = () => {};  // skips ngOnInit
    fixture = TestBed.createComponent(MeterComponent);
    component = fixture.componentInstance;
    component.location = new MockLocation();
    fixture.detectChanges();

    meterSpy = spyOn(component, 'setMeter');
    conSpy = spyOn(component, 'setConcentration');

    component.location = testLocation;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test ngOnInit', () => {

    component.ngOnInit();

    expect(meterSpy).toHaveBeenCalled();
  });

  it('should test ngOnChanges', () => {
    // spyOn(component, 'setMeter');
    // let conSpy = spyOn(component, 'setConcentration');

    component.ngOnChanges({['location']: mockSimpleChange});

    expect(conSpy).toHaveBeenCalled();
  });

  it('should test setMeter - a <= 1', () => {
    const testPercent = 0;
    meterSpy.and.callThrough();

    let result = component.setMeter(testPercent);

    expect('changingThisBreaksApplicationSecurity' in result).toBeTruthy();
  });

  it('should test setMeter - a > 1', () => {
    const testPercent = 10;
    meterSpy.and.callThrough();

    let result = component.setMeter(testPercent);

    expect('changingThisBreaksApplicationSecurity' in result).toBeTruthy();
  });

  it('should test getPercentage2', () => {
    const testPercentage: number = 0;
    let locSpy = spyOn<any>(component['locationService'], 'getPercentage2')
      .and.returnValue(testPercentage);

    component.getPercentage2(testLocation);

    expect(locSpy).toHaveBeenCalled();
  });

  it('should test setConcentration()', () => {
    const testConcentration = 10;
    const testColor = 'green';
    // let expectedResult = `<div style="color: ${testColor};">${testConcentration}</div>`;
    let expectedResult = `<div>${component.formatNumber(testConcentration)}</div>`;
    conSpy.and.callThrough();
    
    let result = component.setConcentration(testConcentration, testColor);

    expect(result).toMatch(expectedResult);
  });

  it('should test formatNumber()', () => {
    const testNumber = 0.75;
    let locSpy = spyOn<any>(component['locationService'], 'formatNumber')
      .and.returnValue(testNumber);

    component.formatNumber(testNumber);

    expect(locSpy).toHaveBeenCalled();
  });

});
