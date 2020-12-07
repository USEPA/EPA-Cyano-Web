import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { of } from 'rxjs';

import { DownloaderService } from '../services/downloader.service';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { AddComment } from './add-comment.component';
import { CommentsComponent } from './comments.component';

import { Comment, Reply } from '../models/comment';

describe('CommentsComponent', () => {

  let component: CommentsComponent;
  let fixture: ComponentFixture<CommentsComponent>;
  let downloaderService: DownloaderService;

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
          useClass: MockAddComment
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});

// Mock objects:
@Component({
  selector: 'add-comment',
  template: ''
})
export class MockAddComment {

}

export class MockDownloaderService {
  getAllComments() {
    return of([{test: "test"}]);
  }
}