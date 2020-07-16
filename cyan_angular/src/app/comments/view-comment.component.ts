import { Component, OnInit, Inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { DownloaderService } from '../services/downloader.service';
import { AuthService } from '../services/auth.service';
import { Comment, Reply } from '../models/comment';
import { DialogComponent } from '../shared/dialog/dialog.component';



@Component({
  selector: 'view-comment',
  templateUrl: 'view-comment.html',
  styleUrls: ['./comments.component.css']
})
export class ViewComment implements OnInit {
  /*
  Dialog for viewing a user comment.
  */

  comment: Comment;
  imageSources: string[] = [];
  body: string = ""; // reply content

  replySizeLimit: number = 500;

  errorMessage: string = "";


  constructor(
    public dialogRef: MatDialogRef<ViewComment>,
    private datePipe: DatePipe,
    private imageDialog: MatDialog,
    private viewCommentDialog: MatDialog,
    private downloader: DownloaderService,
    private authService: AuthService,
    private dialogComponent: DialogComponent,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    this.comment = this.data.comment;
  }

  private createReply(): Reply {
    let newReply = new Reply();
    newReply.comment_id = this.comment.id;
    newReply.comment_user = this.comment.username;
    newReply.date = this.datePipe.transform(new Date(), 'yyyy-MM-dd hh:mm:ss');
    newReply.body = this.body;  // reply content
    return newReply;
  }

  exit(): void {
    this.dialogRef.close();
  }

  displayDialog(message: string): void {
    this.viewCommentDialog.open(DialogComponent, {
      data: {
        dialogMessage: message
      }
    });
  }

  enlargeImage(imageSource): void {
    /*
    Displays larger version of selected image.
    */

    if (!this.authService.checkUserAuthentication()) {
      this.exit();
      return;
    }
    const dialogRef = this.imageDialog.open(ViewImage, {
      width: '80%',
      height: '80%',
      data: {
        imageSource: imageSource
      }
    });
  }

  validateReply(): boolean {
    if (!this.authService.checkUserAuthentication()) {
      this.exit();
      return false;
    }

    if (this.body.length < 1) {
      this.displayDialog("Enter a reply before submitting.");
      return false;
    }
    else if (this.body.length > this.replySizeLimit) {
      this.displayDialog("Reply length is too large (" + this.replySizeLimit + " characters max)");
      return false;
    }

    return true;
  }

  addReplyToComment(): void {
    /*
    Adds reply to a user comment.
    */

    console.log("Adding reply to comment.");

    if (!this.validateReply()) {
      return;
    }

    let reply = this.createReply();
    this.downloader.addReplyToComment(reply).subscribe(response => {
      reply.username = response['username'];  // gets username from response, which is from token
      this.comment.replies.push(reply);  // adds reply to frontend after api response
      this.body = "";  // clears reply textarea
    });
  }

}



@Component({
  selector: 'view-image',
  template: `
  <button mat-button (click)="exit();" class="comments-exit">X</button>
  <div class="view-image">
    <img src={{data.imageSource}} height=100% width=100% />
  </div>
  `,
  styleUrls: ['./comments.component.css']
})
export class ViewImage {
  /*
  Dialog for viewing a user image.
  */

  constructor(
    public dialogRef: MatDialogRef<ViewImage>,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  exit(): void {
    this.dialogRef.close();
  }

}
