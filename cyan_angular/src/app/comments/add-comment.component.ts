import { Component, OnInit, Inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DownloaderService } from '../services/downloader.service';
import { AuthService } from '../services/auth.service';
import { Comment, CommentImage, Reply } from '../models/comment';
import { DialogComponent } from '../shared/dialog/dialog.component';



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
	comment_text: string = "";  // textarea body of comment
  comment_images: CommentImage[] = [];
	imageSources: any[] = [];
  imageUploadLimit: number = 2;
  imageSizeLimit: number = 25e6;  // 25MB
  commentSizeLimit: number = 2000;
  commentTitleLimit: number = 125;

	constructor(
    public dialogRef: MatDialogRef<AddComment>,
    private commentAddedDialog: MatDialog,
    private datePipe: DatePipe,
    private downloader: DownloaderService,
  	private authService: AuthService,
    private dialogComponent: DialogComponent,
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
      newComment.comment_text = this.comment_text;
      newComment.comment_images = this.comment_images
      newComment.replies = [];
    }
    else {
      newComment.id = commentData.id;
      newComment.title = commentData.title;
      newComment.date = commentData.date;
      newComment.username = commentData.username;  // getting username from token
      newComment.device = commentData.device;
      newComment.browser = commentData.browser;
      newComment.comment_text = commentData.comment_text;
      newComment.comment_images = commentData.comment_images
      newComment.replies = [];
    }
  	return newComment;
  }

  private createCommentImage(imageSource, imageName): CommentImage {
    let newCommentImage = new CommentImage();
    newCommentImage.source = imageSource;
    newCommentImage.name = imageName;
    return newCommentImage;
  }

  displayDialog(message: string): void {
    this.commentAddedDialog.open(DialogComponent, {
      data: {
        dialogMessage: message
      }
    });
  }

  validateComment(): boolean {
    if (!this.authService.checkUserAuthentication()) { 
      this.exit();  // exits add-comment dialog
      return false;
    }

    if (this.comment_text.length < 1) {
      this.displayDialog("Enter a comment before submitting");
      return false;
    }
    else if (this.title.length < 1) {
      this.displayDialog("Enter a title before submitting");
      return false;
    }
    else if (this.comment_text.length > this.commentSizeLimit) {
      this.displayDialog("Comment length is too large (" + this.commentSizeLimit + " characters max)");
      return false;
    }
    else if (this.title.length > this.commentTitleLimit) {
      this.displayDialog("Title length is too large (" + this.commentTitleLimit + " characters max)");
      return false;
    }
    return true;
  }

  validateImage(file: File): boolean {
    if (!this.authService.checkUserAuthentication()) { 
      this.exit();  // exits add-comment dialog
      return false;
    }
    if (this.comment_images.length >= this.imageUploadLimit) {
      this.displayDialog("Limited to 2 image uploads per comment");
      return false;
    }
    if (!file.type.includes("image/")) {
      this.displayDialog("Must upload an image");
      return false;
    }
    if (file.type.includes("tif")) {
      this.displayDialog("TIFF images are currently not supported");
      return false;
    }
    return true;
  }

  exit(): void {
    this.dialogRef.close();
  }

  removeImage(image) {
    this.comment_images = this.comment_images.filter(item => item.name !== image.name);
  }

  addNewComment(): void {
  	/*
  	Posts user comment to wall.
  	*/
    if (!this.validateComment()) {
      return;
    }

    let comment = this.createNewComment(null);

  	this.downloader.addUserComment(comment).subscribe(response => {
      let newComment = this.createNewComment(response);  // creates comment object from response
      this.data.comments.unshift(newComment);  // updates parent comments array
      this.displayDialog("Comment submitted");
      this.exit();  // exits this dialog
  	});
	}

	uploadImage(event: any) {
		/*
		Uploads user image, adds image to comment and user's comment data.
		*/

    let file = event.target.files[0];
    let reader = new FileReader();

		if (!this.validateImage(file)) {
      return;
    }
  	
  	reader.readAsDataURL(file);

  	reader.addEventListener('load', (e: any) => {

      // Checks size of image's base64 string:
      if (file.size > this.imageSizeLimit) {
        this.displayDialog("Image size is too large (" + this.imageSizeLimit/1e6 + " MB max)");
        return;
      }

      let newCommentImage = this.createCommentImage(reader.result, file.name);
      this.comment_images.push(newCommentImage);

  	});
  }

}
