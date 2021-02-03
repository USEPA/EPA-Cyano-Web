import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';

import { UserService, UserNotifications } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { NotificationsComponent } from './notifications.component';

describe('NotificationsComponent', () => {

  let component: NotificationsComponent;
  let fixture: ComponentFixture<NotificationsComponent>;

  let testEvent = {
    checked: false
  };

  let testNotificationArray = [
    'testOwner', 1, '2021-01-01', 'test subject', 'test notification body', true
  ];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        MatDialogModule
      ],
      declarations: [ NotificationsComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap,
        {
          provider: UserService,
          useClass: MockUserService
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test ngOnInit()', () => {
    let testUserService = new MockUserService();
    testUserService.sendNotification();

    component.ngOnInit();

    expect(component.notificationSubscription['isStopped']).toBe(false);
  });

  it('should test ngOnDestroy', () => {
    component.ngOnDestroy();

    expect(component.notificationSubscription['isStopped']).toBe(true);
  });

  it('should test toggleChecked() - false', () => {
    component.new_notifications = [];
    component.all_notifications = [new MockNotification()];
    
    component.toggleChecked(testEvent);

    expect(component.display_notifications.length).toEqual(1)
  });

  it('should test toggleChecked() - true', () => {
    component.new_notifications = [];
    component.all_notifications = [new MockNotification()];
    testEvent.checked = true;
    
    component.toggleChecked(testEvent);

    expect(component.display_notifications.length).toEqual(0)
  });

  it('should test notificationSelect() - new notification', () => {
    let userSpy = spyOn<any>(component['userService'], 'updateUserNotifications');
    spyOn(component, 'openNotification');

    component.notificationSelect(testNotificationArray);

    expect(userSpy).toHaveBeenCalled();
  });

  it('should test clearNotifications() - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.clearNotifications();

    expect(result).toBeUndefined();
  });

  it('should test clearNotifications() - clears notifications', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    spyOn<any>(component['userService'], 'clearUserNotifications');
    component.new_notifications = [new MockNotification()];
    component.all_notifications = [new MockNotification()];
    component.display_notifications = [new MockNotification()];

    component.clearNotifications();

    expect(component.new_notifications.length).toBe(0);
    expect(component.all_notifications.length).toBe(0);
    expect(component.display_notifications.length).toBe(0);
  });

  it('should test openNotification() - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.openNotification(new MockNotification(), 1);

    expect(result).toBeUndefined();
  });

  it('should test openNotification() - notification dialog opens', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let dialogSpy = spyOn<any>(component['dialog'], 'open');
    // spyOn<

    component.openNotification(new MockNotification(), 1);

    expect(dialogSpy).toHaveBeenCalled();
  });

});

class MockDialog {
  open(): void {
    return;
  }
}

class MockNotification {
  owner = 'testOwner'
  id = 1
  date = '2021-01-01'
  subject = 'test subject'
  body = 'test notification body'
  is_new = true
}

class MockUserService {

  initNotification = {
    id: 1,
    date: '2021-01-01',
    subject: 'test subject',
    body: 'test notification body',
    is_new: true
  }

  private allNotificationsSource = new BehaviorSubject<UserNotifications[]>([this.initNotification]);  // observable Notifications[] sources
  allNotifications$ = this.allNotificationsSource.asObservable();  // observable Notifications[] streams

  testNotification = new UserNotifications();

  currentAccount: {
    notifications: UserNotifications[]
  }

  sendNotification() {
    this.testNotification.id = 1;
    this.testNotification.date = '2021-01-01';
    this.testNotification.subject = 'test subject';
    this.testNotification.body = 'test notification body';
    this.testNotification.is_new = true;
    this.allNotificationsSource.next([this.testNotification]);
  }

  getUserName() {
    return null;
  }

}
