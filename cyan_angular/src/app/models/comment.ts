export class Comment {
	id: number;
	title: string;
	date: string;
	username: string;
	device: string;
	browser: string;
	comment_text: string;
	comment_images: CommentImage[];
	replies: Reply[];
}

export class CommentImage {
	source: string;
	name: string;
}

export class Reply {
	comment_id: number;
	comment_user: string;
	date: string;
	username: string;
	body: string;
}