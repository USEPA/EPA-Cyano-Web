import datetime

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