import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { of } from 'rxjs';

import { DownloaderService } from '../services/downloader.service';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { AddComment } from './add-comment.component';
import { ViewComment } from './view-comment.component';
import { CommentsComponent } from './comments.component';

import { Comment, Reply, CommentImage } from '../models/comment';

describe('CommentsComponent', () => {

  let component: CommentsComponent;
  let fixture: ComponentFixture<CommentsComponent>;
  // let downloaderService: DownloaderService;

  let testComment: Comment = new Comment();
    testComment.id = 1;
    testComment.title = 'title';
    testComment.date = 'date';
    testComment.username = 'username';
    testComment.device = 'device';
    testComment.browser = 'browser';
    testComment.comment_text = 'comment text';
    testComment.comment_images = null;
    testComment.replies = null;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule,
        MatDialogModule
      ],
      declarations: [
        CommentsComponent
      ],
      providers: [
        AuthService,
        LoaderService,
        {
          provide: AddComment,
          useClass: MockDialog
        },
        {
          provide: MatDialog,
          useClass: MockDialog
        },
        {
          provide: DownloaderService,
          useClass: MockDownloaderService
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create comments component', () => {
    expect(component).toBeTruthy();
  });

  it('should test getComments() - ', () => {
    let testComments: Comment[] = [testComment];
    spyOn<any>(component['downloader'], 'getAllComments')
      .and.returnValue(of(testComments));

    component.getComments();

    expect(component.comments[0].title).toEqual(testComment.title);
  });

  it('should test viewComment() dialog open', () => {    
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    component.viewComment(testComment);

    expect(component.viewComment).toBeDefined();
  });

  it('should test addNewComment() dialog open', () => {    
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    component.addNewComment();

    expect(component.addNewComment).toBeDefined();
  });

});

// Mock objects:
export class MockDialog {
  open(): void {
    return;
  }
}
export class MockDownloaderService {
  getAllComments() {
    return of([{test: "test"}]);
  }
}