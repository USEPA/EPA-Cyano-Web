import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { Options, ChangeContext } from 'ng5-slider';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { UserService } from '../services/user.service';
import { CyanMap } from '../utils/cyan-map';
import { ConfigComponent } from './config.component';
import { UserSettings } from '../models/settings';
import { Account } from '../services/user.service';

describe('ConfigComponent', () => {
  let component: ConfigComponent;
  let fixture: ComponentFixture<ConfigComponent>;
  let service;

  let testSettings: UserSettings = {
    level_low: 0,
    level_medium: 5,
    level_high: 10,
    enable_alert: false,
    alert_value: 5
  };

  let testAccount: Account = {
    user: null,
    locations: null,
    notifications: null,
    settings: testSettings
  }

  let testChangeContext: ChangeContext = new ChangeContext();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule
      ],
      declarations: [
        ConfigComponent
      ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    service = TestBed.get(UserService)
    service.currentAccount = testAccount;

  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test getRanges()', () => {

    component.getRanges();

    expect(component.user_settings.level_low).toEqual(testAccount.settings.level_low);
    expect(component.user_inputs.level_low).toEqual(testAccount.settings.level_low);
  });

  it('should test validateInputValue() - caps max level setting', () => {
    const origMaxLevel = component.slider_options.ceil;
    const exceededMaxLevel = origMaxLevel + 1;
    component.user_inputs.level_high = exceededMaxLevel;

    component.validateInputValue(testChangeContext);

    expect(component.user_inputs.level_high).toEqual(origMaxLevel);
  });

  it('should test validateInputValue() - adjusts levels if medium is above high', () => {
    const sliderStep = component.slider_options.step;
    component.user_inputs.level_high = testSettings.level_high;
    component.user_inputs.level_medium = testSettings.level_high;

    component.validateInputValue(testChangeContext);

    expect(component.user_inputs.level_medium).toEqual(component.user_inputs.level_high - sliderStep);
  });

  it('should test validateInputValue() - adjusts levels if medium is below low', () => {
    const sliderStep = component.slider_options.step;
    component.user_inputs.level_low = testSettings.level_low;
    component.user_inputs.level_medium = testSettings.level_low;

    component.validateInputValue(testChangeContext);

    console.log("# " + component.user_inputs.level_low )

    expect(component.user_inputs.level_low).toEqual(component.user_inputs.level_medium - sliderStep);


  });

  it('should test validateInputValue() - adjusts alert level if greater than alert max', () => {
    const alertMax = component.slider_options_alert.ceil;
    component.user_inputs.alert_value = alertMax + 1;

    component.validateInputValue(testChangeContext);

    expect(component.user_inputs.alert_value).toEqual(alertMax);
  });

  it('should test validateInputValue() - adjusts alert level if greater than alert max', () => {
    component.user_inputs = testSettings;

    component.validateInputValue(testChangeContext);

    expect(component.user_settings).toBeDefined();
  });

  it('should test validateValue() - adjust level low if greater than level medium', () => {
    const slider = 'low';
    const sliderStep = component.slider_options.step;
    component.user_settings = testSettings;
    component.user_settings.level_low = testSettings.level_medium;

    component.validateValue(testChangeContext, slider);

    expect(component.user_settings.level_low).toEqual(component.user_settings.level_medium - sliderStep);
  });

  it('should test validateValue() - adjust medium level if less than low', () => {
    const slider = 'med';
    const sliderStep = component.slider_options.step;
    component.user_settings = testSettings;
    component.user_settings.level_medium = testSettings.level_low;

    component.validateValue(testChangeContext, slider);

    expect(component.user_settings.level_low).toEqual(component.user_settings.level_medium - sliderStep);
  });

  it('should test validateValue() - adjust medium level if greater than high', () => {
    const slider = 'med';
    const sliderStep = component.slider_options.step;
    component.user_settings = testSettings;
    component.user_settings.level_medium = testSettings.level_high;

    component.validateValue(testChangeContext, slider);

    expect(component.user_settings.level_medium).toEqual(component.user_settings.level_high - sliderStep);
  });

  it('should test validateValue() - adjust medium level if greater than high', () => {
    const slider = 'hi';
    const sliderStep = component.slider_options.step;
    component.user_settings = testSettings;
    component.user_settings.level_medium = testSettings.level_high;

    component.validateValue(testChangeContext, slider);

    expect(component.user_settings.level_medium).toEqual(component.user_settings.level_high - sliderStep);
  });

  it('should test validateValue() - adjust medium level if greater than high', () => {
    const slider = 'vhi';
    const sliderStep = component.slider_options.step;
    component.user_settings = testSettings;
    component.user_settings.level_medium = testSettings.level_high;

    component.validateValue(testChangeContext, slider);

    expect(component.user_settings.level_medium).toEqual(component.user_settings.level_high - sliderStep);
  });

  it('should test saveConfig() - update user settings error', () => {
    spyOn<any>(component['userService'], 'updateUserSettings')
      .and.returnValue(throwError('test error message'));
    spyOn(window.console, 'error');

    component.saveConfig();

    expect(window.console.error).toHaveBeenCalled();
  });

  it('should test saveConfig() - update user settings success', () => {
    spyOn<any>(component['userService'], 'updateUserSettings')
      .and.returnValue(of(testAccount));
    spyOn<any>(component['locationService'], 'updateMarkers');
    spyOn(component, 'exitConfig');

    component.saveConfig();

    expect(component.exitConfig).toHaveBeenCalled();
  });

  it('should test exitConfig()', () => {
    let routerSpy = spyOn<any>(component['router'], 'navigate');

    component.exitConfig();

    expect(routerSpy).toHaveBeenCalledWith(['']);
  });

});
