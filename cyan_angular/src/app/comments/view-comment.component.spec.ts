import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { ViewComment } from './view-comment.component';
import { DialogComponent } from '../shared/dialog/dialog.component';

import { Comment, Reply, CommentImage } from '../models/comment';


describe('ViewComment', () => {

  let component: ViewComment;
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

  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };

  const mockDialogComponent = {

  };

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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
