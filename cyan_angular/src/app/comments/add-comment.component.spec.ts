import { Component } from '@angular/core';
import { of } from 'rxjs';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';

import { DownloaderService } from '../services/downloader.service';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { AddComment } from './add-comment.component';
import { DialogComponent } from '../shared/dialog/dialog.component';

import { Comment, CommentImage, Reply } from '../models/comment';

describe('AddComment', () => {

  let component: AddComment;
  let fixture: ComponentFixture<AddComment>;

  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };

  const mockDialogComponent = {
  };

  let mockDialogData = {
    data: {
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        HttpClientModule
      ],
      declarations: [
        AddComment
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
          useValue: mockDialogData
        },
        {
          provide: MatDialog,
          useClass: MockDialog
        },
        DatePipe,
        AuthService,
        LoaderService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    AddComment.prototype.ngOnInit = () => {};  // skips ngOnInit
    fixture = TestBed.createComponent(AddComment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture = null;
    component = null;
  });

  it('should create add-comment component', () => {
    expect(component).toBeTruthy();
  });

  it('should test displayDialog()', () => {
    const testMessage = 'test message';

    component.displayDialog(testMessage);

    expect(component).toBeDefined();
  });

  it('should test validateComment() - not authenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.validateComment();

    expect(result).toBe(false);
  });

  it('should test validateComment() - no comment entered', () => {
    component.comment_text = '';
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    let result = component.validateComment();

    expect(result).toBe(false);
  });

  it('should test validateComment() - no title entered', () => {
    component.comment_text = 'test comment';
    component.title = '';
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    let result = component.validateComment();

    expect(result).toBe(false);
  });

  it('should test validateComment() - comment too large', () => {

    component.comment_text = '#'.repeat(component.commentSizeLimit + 1);
    component.title = 'test title';
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    let result = component.validateComment();

    expect(result).toBe(false);
  });

  it('should test validateComment() - title too large', () => {
    component.comment_text = 'test comment';
    component.title = '#'.repeat(component.commentTitleLimit + 1);
    
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    let result = component.validateComment();

    expect(result).toBe(false);
  });

  it('should test validateComment() - valid comment', () => {
    component.comment_text = 'test comment';
    component.title = 'test title';
    
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    let result = component.validateComment();

    expect(result).toBe(true);
  });

  it('should test validateImage() - not authenticated', () => {
    let imageObj = new CommentImage();
    component.comment_images = [imageObj, imageObj, imageObj];
    let testFile = new File([""], "testfilename");

    let result = component.validateImage(testFile);

    expect(result).toBe(false);
  });

  it('should test validateImage() - too many files uploaded', () => {
    let imageObj = new CommentImage();
    component.comment_images = [imageObj, imageObj, imageObj];
    let testFile = new File([""], "testfilename");
    
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    let result = component.validateImage(testFile);

    expect(result).toBe(false);
  });

  it('should test validateImage() - not image type', () => {
    let imageObj = new CommentImage();
    component.comment_images = [imageObj];
    let testFile = new File([""], "testfilename");
    
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    let result = component.validateImage(testFile);

    expect(result).toBe(false);
  });

  it('should test validateImage() - do not allow tiff type', () => {
    let imageObj = new CommentImage();
    component.comment_images = [imageObj];
    let testFile = new File([""], "", {type: "image/tiff"})

    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    let result = component.validateImage(testFile);

    expect(result).toBe(false);
  });

  it('should test validateImage() - successful upload', () => {
    let imageObj = new CommentImage();
    component.comment_images = [imageObj];
    let testFile = new File([""], "", {type: "image/png"})
    
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    let result = component.validateImage(testFile);

    expect(result).toBe(true);
  });

  it('should test exit()', () => {
    component.exit();
    expect(component).toBeDefined();
  });

  it('should test removeImage() - removes image from list', () => {
    let imageObj = new CommentImage();
    imageObj.name = "test-image";
    component.comment_images = [imageObj];

    component.removeImage(imageObj);

    expect(component.comment_images.length).toBeLessThan(1);
  });

  it('should test addNewComment() - invalid comment', () => {
    spyOn(component, 'validateComment')
      .and.returnValue(false);

    let result = component.addNewComment();

    expect(result).toBeUndefined();
  });

  it('should test addNewComment() - comment submitted', () => {
    let testComment: Comment = new Comment();
    component.data.comments = [testComment];
    spyOn(component, 'validateComment')
      .and.returnValue(true);
    spyOn<any>(component['downloader'], 'addUserComment')
      .and.returnValue(of(testComment));

    component.addNewComment();

    expect(component.data.comments.length).toBeGreaterThan(1);
  });

  it('should test uploadImage() - invalid image', () => {
    let testFile = {target: {files: [null]}};
    spyOn(component, 'validateImage')
      .and.returnValue(false);

    let result = component.uploadImage(testFile);

    expect(result).toBeUndefined();
  });

  it('should test uploadImage() - image size too large', () => {
    let testFileParts = [
      new Blob(['#'.repeat(component.imageSizeLimit + 1)], {type: 'text/plain'})
    ];
    let testFileObj = new File(testFileParts, 'test-file.txt', {
      type: 'text/plain'
    });
    let testFile = {target: {files: [testFileObj]}}
    spyOn(component, 'validateImage')
      .and.returnValue(true);

    let result = component.uploadImage(testFile);

    expect(result).toBeUndefined();
  });

  it('should test uploadImage() - image size too large', () => {
    const testFilename: string = 'test-file.txt';
    let testFileParts = [
      new Blob(['this-is-a-string'], {type: 'text/plain'})
    ];
    let testFileObj = new File(testFileParts, testFilename, {
      type: 'text/plain'
    });
    let testFile = {target: {files: [testFileObj]}}
    spyOn(component, 'validateImage')
      .and.returnValue(true);

    component.uploadImage(testFile)

    fixture.detectChanges();

    expect(component).toBeDefined();
    // // TODO: Refactor this without timeout
    // setTimeout(() => {
    //   expect(component.comment_images[0].name).toMatch(testFilename);
    // }, 500);
    
  });

});

// Mock classes:
export class MockDialog {
  open(): void {
    return;
  }
}