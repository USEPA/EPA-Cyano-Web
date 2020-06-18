import time
import datetime
import requests
import json
import logging


def convert_to_timestamp(unix_time):
	"""
	Converts notifications endpoint's timestamps.
	"""
	trimmed_time = int(str(unix_time)[:-3])  # NOTE: trimming off 3 trailing 0s
	return datetime.datetime.fromtimestamp(trimmed_time).strftime('%Y-%m-%d %H:%M:%S')

def convert_to_unix(timestamp):
	"""
	Converts notification timestamp to unix time.
	"""
	dt = datetime.datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
	unix_time = dt.timetuple()
	unix_time = int(time.mktime(unix_time))
	return unix_time

def make_notifications_request(latest_time):
	"""
	Gets all notifications from epa cyano endpoint.
	"""
	formatted_time = datetime.datetime.fromtimestamp(latest_time).strftime('%Y-%m-%d')

	notification_url = 'https://cyan.epa.gov/cyan/cyano/notifications/'
	start_date = '{}T00-00-00-000-0000'.format(formatted_time)
	try:
		notification_response = requests.get(notification_url + start_date)
		return json.loads(notification_response.content)
	except requests.exceptions.Timeout:
		logging.warning("Request to {} timed out.".format(notification_url))
		# TODO: Retry request.
		return None
	except requests.exceptions.RequestException as e:
		logging.warning("Error making request to {}.".format(notification_url))
		# TODO: Handle error.
		return None
	except Exception as e:
		logging.warning("Unknown exception occurred: {}".format(e))
		# TODO: Handle error.
		return None

def build_comments_json(comments):
	"""
	Creates serializable json from comment DB objects.
	"""
	comments_json = []
	for comment in comments:
		comments_json.append({
			'id': comment.id,
			'title': comment.title,
			'date': get_datetime_string(comment.date),
			'username': comment.username,
			'device': comment.device,
			'browser': comment.browser,
			# 'body': comment.body,
			'body': build_comment_body_json(comment.body),
			'replies': build_replies_json(comment.replies)
		})
	return comments_json

def build_replies_json(replies):
	"""
	Creates serializable json from reply DB objects.
	"""
	replies_json = []
	for reply in replies:
		replies_json.append({
			'id': reply.id,
			'comment_id': reply.comment_id,
			'date': get_datetime_string(reply.date),
			'username': reply.username,
			'body': reply.body
		})
	return replies_json

def build_comment_body_json(comment_body):
	"""
	Creates serializable json from comment_body DB objects.
	"""
	if isinstance(comment_body, list):
		comment_body = comment_body[0]

	comment_body_json = {
		'comment_text': comment_body.comment_text,
		'comment_images': []
	}
	for image in comment_body.comment_images:
		comment_body_json['comment_images'].append(image.comment_image)
	return comment_body_json


def get_datetime_string(datetime_obj):
	"""
	Returns date and time from datetime object.
	Example: DateTime(2020-06-10 10:35:00.12345) --> "2020-06-10 10:35:00"
	"""
	return str(datetime_obj).split('.')[0]