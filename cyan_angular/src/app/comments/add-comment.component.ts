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
	// username: string = null;
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
    private datePipe: DatePipe,
    private downloader: DownloaderService,
  	private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
    
  }

  private createNewComment(): Comment {
  	/*
  	Creates comment object from form fields.
  	*/
  	let newComment = new Comment();
  	newComment.title = this.title;
  	newComment.date = this.datePipe.transform(new Date(), 'yyyy-MM-dd hh:mm:ss');
  	// newComment.username = this.username;  // getting username from token
  	newComment.device = this.device;
  	newComment.browser = this.browser;
  	newComment.body = {comment_text: this.comment_text, comment_images: this.imageSources};
  	newComment.replies = [];
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
  	
    // TODO: More validity checking for user comments?

    if (this.comment_text.length < 1) {
      // Add message to user about comment needing text.
      this.errorMessage = "Enter a comment before submitting.";
      return;
    }

  	let comment = this.createNewComment();

  	this.downloader.addUserComment(comment).subscribe(response => {
  		// TODOs:
      // Check if successful, "commented added" message (shared dialog component for user messages, warnings, errors, etc.)
  		// Also could load all comments so new comment is displayed.
      // And exit this dialog once comment is submitted.
      this.exit();
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
