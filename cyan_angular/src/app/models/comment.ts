export class Comment {
	id: number;
	title: string;
	date: string;
	username: string;
	device: string;
	browser: string;
	body: CommentBody;
	replies: Reply[];
}

export class CommentBody {
	comment_text: string;
	comment_images: string[];
}

export class Reply {
	comment_id: number;
	comment_user: string;
	date: string;
	username: string;
	body: string;
}