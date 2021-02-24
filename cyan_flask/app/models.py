import os
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import expression
from sqlalchemy.dialects.mysql import MEDIUMTEXT, LONGTEXT
from flask_migrate import Migrate


db = SQLAlchemy()
migrate = Migrate()


class User(db.Model):
    __tablename__ = "user"
    id = db.Column(db.Integer, nullable=False, primary_key=True)
    username = db.Column(db.String(35), nullable=False, unique=True)
    email = db.Column(db.String(50), nullable=False, unique=True)
    password = db.Column(db.String(256), nullable=False)
    created = db.Column(db.DateTime, nullable=False)
    last_visit = db.Column(db.DateTime, nullable=False)
    # job = db.Column(db.String(256), nullable=False)  # batch job ID
    # job_status = db.Column(db.String(32), nullable=False)  # batch job status


class Location(db.Model):
    __tablename__ = "location"
    owner = db.Column(db.String(35), nullable=False, primary_key=True)
    id = db.Column(db.Integer, nullable=False, primary_key=True)
    type = db.Column(
        db.SmallInteger,
        nullable=False,
        server_default=expression.true(),
        primary_key=True,
    )
    name = db.Column(db.String(256), nullable=False)
    latitude = db.Column(db.Numeric(12, 10), nullable=False)
    longitude = db.Column(db.Numeric(13, 10), nullable=False)
    marked = db.Column(db.Boolean, nullable=False, server_default=expression.false())
    notes = db.Column(db.Text, nullable=False)
    compare = db.Column(db.Boolean, nullable=False, server_default=expression.false())


class Notifications(db.Model):
    __tablename__ = "notifications"
    owner = db.Column(db.String(35), nullable=False, primary_key=True)
    id = db.Column(db.Integer, nullable=False, primary_key=True)
    date = db.Column(db.DateTime, nullable=False)
    subject = db.Column(db.String(256), nullable=False)
    body = db.Column(db.Text, nullable=False)
    is_new = db.Column(db.Boolean, nullable=False)


class Settings(db.Model):
    __tablename__ = "settings"
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=False, primary_key=True
    )
    level_low = db.Column(db.Integer, nullable=False)
    level_medium = db.Column(db.Integer, nullable=False)
    level_high = db.Column(db.Integer, nullable=False)
    enable_alert = db.Column(db.Boolean, nullable=False)
    alert_value = db.Column(db.Integer)


class Comment(db.Model):
    __tablename__ = "comment"
    id = db.Column(db.Integer, nullable=False, primary_key=True)
    title = db.Column(db.String(128), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    username = db.Column(db.String(32), nullable=False)
    device = db.Column(db.String(64), nullable=False, server_default="N/A")
    browser = db.Column(db.String(64), nullable=False, server_default="N/A")
    comment_text = db.Column(db.String(2000), nullable=False)
    comment_images = db.relationship("CommentImages", backref="comment_body", lazy=True)
    replies = db.relationship("Reply", backref="comment", lazy=True)


class CommentImages(db.Model):
    __tablename__ = "comment_images"
    id = db.Column(db.Integer, nullable=False, primary_key=True)
    comment_id = db.Column(db.Integer, db.ForeignKey("comment.id"), nullable=False)
    comment_image = db.Column(db.String(256), nullable=False)  # path to image source


class Reply(db.Model):
    __tablename__ = "comment_reply"
    id = db.Column(db.Integer, nullable=False, primary_key=True)
    comment_id = db.Column(db.Integer, db.ForeignKey("comment.id"), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    username = db.Column(db.String(32), nullable=False)
    body = db.Column(db.String(500), nullable=False)

class Job(db.Model):
    __tablename__ = "job"
    id = db.Column(db.Integer, nullable=False, primary_key=True)
    job_id = db.Column(db.String(256), nullable=False)  # batch job ID
    job_status = db.Column(db.String(32), nullable=False)  # batch job status
    # job_request = 
    # job_locations = db.relationship("JobLocation", backref="job", lazy=True)

# class JobLocation(db.Model):
#     __tablename__ = "job_location"
#     id = db.Column(db.Integer, nullable=False, primary_key=True)
#     type = db.Column(
#         db.SmallInteger,
#         nullable=False,
#         server_default=expression.true(),
#         primary_key=True,
#     )
#     latitude = db.Column(db.Numeric(12, 10), nullable=False)
#     longitude = db.Column(db.Numeric(13, 10), nullable=False)

# class JobRequest(db.Model):
#     __tablename__ = "job_request"
#     id = db.Column(db.Integer, nullable=False, primary_key=True)
#     # locations =   # list of locations requested by user (map to location table?)


