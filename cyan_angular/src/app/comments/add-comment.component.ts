import { Component, OnInit, Inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';

import { DownloaderService } from '../services/downloader.service';
import { AuthService } from '../services/auth.service';

import { Comment, CommentBody, Reply } from '../models/comment';



@Component({
  selector: 'add-comment',
  templateUrl: 'add-comment.html',
  styleUrls: ['./comments.component.css']
})
export class AddComment implements OnInit {
	/*
	Dialog for adding a user comment.
	*/
	device: string = "";
	browser: string = "";
	title: string = "";
	body = {
		comment_text: "",
		comment_images: []
	}
	comment_text: string = "";  // textarea body of comment
	comment_images: string[] = [];  // array of image sources
	imageSources: any[] = [];
  imageUploadLimit: number = 2;
  errorMessage: string = "";

	constructor(
    public dialogRef: MatDialogRef<AddComment>,
    private commentAddedDialog: MatDialog,
    private datePipe: DatePipe,
    private downloader: DownloaderService,
  	private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {

  }

  private createNewComment(commentData): Comment {
  	/*
  	Creates comment object from form fields.
  	*/
  	let newComment = new Comment();
    if (!commentData) {
      newComment.title = this.title;
      newComment.date = this.datePipe.transform(new Date(), 'yyyy-MM-dd hh:mm:ss');
      newComment.device = this.device;
      newComment.browser = this.browser;
      newComment.body = {comment_text: this.comment_text, comment_images: this.imageSources};
      newComment.replies = [];
    }
    else {
      newComment.id = commentData.id;
      newComment.title = commentData.title;
      newComment.date = commentData.date;
      newComment.username = commentData.username;  // getting username from token
      newComment.device = commentData.device;
      newComment.browser = commentData.browser;
      newComment.body = {comment_text: commentData.body.comment_text, comment_images: commentData.body.comment_images};
      newComment.replies = [];
    }
  	return newComment;
  }

  exit(): void {
    this.dialogRef.close();
  }

  addNewComment(): void {
  	/*
  	Posts user comment to wall.
  	*/
  	if (!this.authService.checkUserAuthentication()) { 
      this.exit();
      return;
    }

    if (this.comment_text.length < 1) {
      // Add message to user about comment needing text.
      this.errorMessage = "Enter a comment before submitting.";
      return;
    }
    else if (this.title.length < 1) {
      this.errorMessage = "Enter a title before submitting.";
      return;
    }

    let comment = this.createNewComment(null);

  	this.downloader.addUserComment(comment).subscribe(response => {

      let newComment = this.createNewComment(response);  // creates comment object from response

      this.data.comments.unshift(newComment);  // updates parent comments array

      // Opens comment submitted dialog:
      const dialogRef = this.commentAddedDialog.open(CommentAdded, {
        // width: '25%',
        // height: '25%',
        // data: { }
      });

      this.exit();  // exits this dialog

  	});
	}

	uploadImage(event: any) {
		/*
		Uploads user image, adds image to comment and user's comment data.
		*/

		if (!this.authService.checkUserAuthentication()) { 
      this.exit();
      return;
    }

    if (this.imageSources.length >= this.imageUploadLimit) {
      this.errorMessage = "Limited to 2 image uploads per comment.";
      return;
    }

  	let file = event.target.files[0];
  	let reader = new FileReader();
  	
  	reader.readAsDataURL(file);

  	reader.addEventListener('load', (e: any) => {
  		this.imageSources.push(reader.result);
  	});
  }

}



@Component({
  selector: 'comment-added',
  template: `
  <br><br>
  <div class="center-wrapper">
  <h6 class="center-item">Comment submitted.</h6>
  <br><br>
  <button class="center-item" mat-raised-button color="primary" (click)="exit();">OK</button>
  </div>
  <br>
  `,
  styleUrls: ['./comments.component.css']
})
export class CommentAdded {
  /*
  Dialog for viewing a user image.
  */

  constructor(
    public dialogRef: MatDialogRef<CommentAdded>,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  exit(): void {
    this.dialogRef.close();
  }

}
