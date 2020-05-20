import os
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import expression
from flask_migrate import Migrate


db = SQLAlchemy()
migrate = Migrate()


class User(db.Model):
	__tablename__ = 'user'
	id = db.Column(db.Integer, nullable=False, primary_key=True)
	username = db.Column(db.String(35), nullable=False, unique=True)
	email = db.Column(db.String(50), nullable=False, unique=True)
	password = db.Column(db.String(256), nullable=False)
	created = db.Column(db.Date, nullable=False)
	last_visit = db.Column(db.Date, nullable=False)

class Location(db.Model):
	__tablename__ = 'location'
	owner = db.Column(db.String(35), nullable=False, primary_key=True)
	id = db.Column(db.Integer, nullable=False, primary_key=True)
	type = db.Column(db.SmallInteger, nullable=False, server_default=expression.true(), primary_key=True)
	name = db.Column(db.String(256), nullable=False)
	latitude = db.Column(db.Numeric(12,10), nullable=False)
	longitude = db.Column(db.Numeric(13,10), nullable=False)
	marked = db.Column(db.Boolean, nullable=False, server_default=expression.false())
	notes = db.Column(db.Text, nullable=False)
	compare = db.Column(db.Boolean, nullable=False, server_default=expression.false())

class Notifications(db.Model):
	__tablename__ = 'notifications'
	owner = db.Column(db.String(35), nullable=False, primary_key=True)
	id = db.Column(db.Integer, nullable=False, primary_key=True)
	date = db.Column(db.DateTime, nullable=False)
	subject = db.Column(db.String(256), nullable=False)
	body = db.Column(db.Text, nullable=False)
	is_new = db.Column(db.Boolean, nullable=False)

class Settings(db.Model):
	__tablename__ = 'settings'
	user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, primary_key=True)
	level_low = db.Column(db.Integer, nullable=False)
	level_medium = db.Column(db.Integer, nullable=False)
	level_high = db.Column(db.Integer, nullable=False)
	enable_alert = db.Column(db.Boolean, nullable=False)
	alert_value = db.Column(db.Integer)