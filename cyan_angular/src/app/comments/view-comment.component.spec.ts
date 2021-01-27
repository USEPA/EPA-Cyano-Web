import { Component } from '@angular/core';
import { of } from 'rxjs';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { ViewComment, ViewImage } from './view-comment.component';
import { DialogComponent } from '../shared/dialog/dialog.component';

import { Comment, Reply, CommentImage } from '../models/comment';


describe('ViewComment', () => {

  let component: ViewComment;
  let viewImage: ViewImage;
  let fixture: ComponentFixture<ViewComment>;

  const testReply: Reply = new Reply();

  const testCommentImage: CommentImage = new CommentImage();

  const testComment: Comment = {
    id: 1,
    title: "test title",
    date: "test date",
    username: "test user",
    device: "test device",
    browser: "test browser",
    comment_text: "test comment text",
    comment_images: [testCommentImage],
    replies: [testReply]
  };

  testReply.comment_id = testComment.id;
  testReply.comment_user = testComment.username;
  testReply.username = "reply-username"
  testReply.body = "test reply body"

  const mockViewImage = {
    data: null
  }

  const mockDialogRef = {
    close: jasmine.createSpy('close'),
    open: jasmine.createSpy('open'),
    data: null
  };

  const mockDialogComponent = {
    data: {
      dialogMessage: ''
    }
  };

  let mockDialog = {
    // open: jasmine.createSpy('open').and.returnValue(of({data: null}))
    open: jasmine.createSpy('open').and.returnValue(mockViewImage)
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        HttpClientModule
      ],
      declarations: [
        ViewComment
      ],
      providers: [
        {
          provide: MatDialogRef,
          useValue: mockDialogRef
        },
        {
          provide: DialogComponent,
          useValue: mockDialogComponent
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { comment: testComment }
        },
        {
          provide: MatDialog,
          useValue: mockDialog
        },
        DatePipe,
        AuthService,
        LoaderService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewComment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture = null;
    component = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test exit()', () => {
    component.exit();
    expect(component).toBeDefined();
  });

  it('should test displayDialog()', () => {
    const testMessage = 'this is a test message';

    component.displayDialog(testMessage);

    expect(component).toBeDefined();
  });

  it('should test enlargeImage() - not authenticated', () => {
    const imageSource = "someimagesource";
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.enlargeImage(imageSource);

    expect(result).toBeUndefined();
  });

  it('should test enlargeImage() - open dialog', () => {
    const imageSource = "someimagesource";
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    let result = component.enlargeImage(imageSource);

    // TODO: Proper mocking of dialog.
    expect(result).toBeUndefined();
  });

  it('should test validateReply() - not authenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.validateReply();

    expect(result).toBe(false);
  });

  it('should test validateReply() - reply body is empty', () => {
    component.body = '';
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    let result = component.validateReply();

    expect(result).toBe(false);
  });

  it('should test validateReply() - reply body is too large', () => {
    component.body = '#'.repeat(component.replySizeLimit + 1);
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    let result = component.validateReply();

    expect(result).toBe(false);
  });

  it('should test validateReply() - valid reply', () => {
    component.body = 'valid reply';
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    let result = component.validateReply();

    expect(result).toBe(true);
  });

  it('should test addReplyToComment() - invalid reply', () => {
    spyOn(component, 'validateReply')
      .and.returnValue(false);

    let result = component.addReplyToComment();

    expect(result).toBeUndefined();
  });

  it('should test addReplyToComment() - valid reply', () => {
    spyOn(component, 'validateReply')
      .and.returnValue(true);
    spyOn<any>(component['downloader'], 'addReplyToComment')
      .and.returnValue(of(testReply));

    let result = component.addReplyToComment();

    expect(component.comment.replies.length).toBeGreaterThan(1);
  });

});
