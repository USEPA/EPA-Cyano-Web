"""
Builds tables for local DB that handles user account and user location information.
"""

import os
import sys
import sqlite3
import mysql.connector

# Local imports:
# from models import user



BASE_DIR = os.path.dirname(os.path.abspath(__file__))



class DBHandler(object):

	def __init__(self, db_name):
		self.db_name = db_name

	def process_env_string(self, env_string):
		return env_string.replace("\r", "").replace("\n", "").replace(" ", "")

	def connect_to_db(self):
		conn = mysql.connector.connect(
			host=self.process_env_string(os.environ.get('DB_HOST')),
			port=self.process_env_string(os.environ.get('DB_PORT')),
			user=self.process_env_string(os.environ.get('DB_USER')),
			passwd=self.process_env_string(os.environ.get('DB_PASS')),
		)
		if self.db_name:
			conn.connect(database=self.process_env_string(self.db_name))
		return conn

	def delete_table(self, table_name):
		conn = self.connect_to_db()
		c = conn.cursor()
		query = """
		DROP TABLE {};
		""".format(table_name)
		try:
			c.execute(query)
		except mysql.connector.Error as e:
			conn.close()
			print("query_database error: {}".format(e))
			return {"error": "Error deleting table."}
		conn.commit()
		conn.close()

	def create_database(self):
		conn = self.connect_to_db()
		c = conn.cursor()
		dbs = c.execute("SHOW DATABASES")
		query = """
		CREATE DATABASE {};
		""".format(self.db_name)
		try:
			if dbs and len(dbs) < 1:
				c.execute(query)
		except mysql.connector.Error as e:
			conn.close()
			print("query_database error: {}".format(e))
			return {"error": "Error accessing database"}
		conn.close()

	def create_user_table(self):
		conn = self.connect_to_db()
		c = conn.cursor()
		query = """
		CREATE TABLE IF NOT EXISTS User (
			id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
			username VARCHAR(20) CHARACTER SET utf8 NOT NULL UNIQUE,
			email VARCHAR(50) NOT NULL UNIQUE,
			password VARCHAR(300) NOT NULL UNIQUE,
			created  DATE NOT NULL,
			last_visit DATE NOT NULL
		);
		"""
		try:
			c.execute(query)
		except mysql.connector.Error as e:
			conn.close()
			print("query_database error: {}".format(e))
			return {"error": "Error accessing database"}
		conn.commit()
		conn.close()

	def create_location_table(self):
		conn = self.connect_to_db()
		c = conn.cursor()
		query = """
		CREATE TABLE IF NOT EXISTS Location (
			owner VARCHAR(20) CHARACTER SET utf8 NOT NULL,
			id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(256) NOT NULL,
			latitude DECIMAL(12,10) NOT NULL,
			longitude DECIMAL(13,10) NOT NULL,
			marked BIT NOT NULL,
			notes TEXT NOT NULL
		);
		"""
		try:
			c.execute(query)
		except mysql.connector.Error as e:
			conn.close()
			print("query_database error: {}".format(e))
			return {"error": "Error accessing database"}
		conn.commit()
		conn.close()



if __name__ == '__main__':
	
	try:
		db_name = sys.argv[1]
	except IndexError:
		raise Exception("No db name arg specified.")
	try:
		table_name = sys.argv[2]
	except IndexError:
		print("No table name specified for 2nd arg, which may not matter.")
		pass
	try:
		option = sys.argv[3]
	except IndexError:
		print("No option specified.")

	dbh = DBHandler(db_name)

	if option == 1:
		print("Creating database: {}".format(db_name))
		dbh.create_database()
	elif option == 2:
		print("Creating User table in {}".format(db_name))
		dbh.create_user_table()
	elif option == 3:
		print("Creating Location table in {}".format(db_name))
		dbh.create_location_table()
	elif option == 4:
		print("Deleting table: {}".format(table_name))
		dbh.delete_table(table_name)