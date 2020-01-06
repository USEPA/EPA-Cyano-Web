"""
Builds tables for local DB that handles user account and user location information.
"""

import os
import sys
import mysql.connector



BASE_DIR = os.path.dirname(os.path.abspath(__file__))



class DBHandler(object):

	def __init__(self, db_name):
		self.db_name = db_name

	def connect_to_db(self, db_name=None):
		conn = mysql.connector.connect(
			host=os.environ.get('DB_HOST'),
			port=os.environ.get('DB_PORT'),
			user=os.environ.get('DB_USER'),
			passwd=os.environ.get('DB_PASS'),
			buffered=True
		)
		if db_name:
			conn.connect(database=self.db_name)
		return conn

	def execute_query(self, query, db_name=None):
		conn = self.connect_to_db(db_name)
		c = conn.cursor()
		try:
			c.execute(query)
		except mysql.connector.Error as e:
			conn.close()
			print("query_database error: {}".format(e))
			print("query: {}".format(query))
		conn.commit()
		conn.close()
		

	def delete_table(self, table_name):
		query = """
		DROP TABLE {};
		""".format(table_name)
		self.execute_query(query, self.db_name)

	def create_database(self):
		query = """
		CREATE DATABASE {};
		""".format(self.db_name)
		self.execute_query(query)

	def delete_database(self):
		query = """
		DROP DATABASE {};
		""".format(self.db_name)
		self.execute_query(query)

	def create_user_table(self):
		query = """
		CREATE TABLE IF NOT EXISTS User (
			id INT(11) NOT NULL AUTO_INCREMENT,
			username VARCHAR(15) CHARACTER SET utf8 NOT NULL UNIQUE,
			email VARCHAR(50) NOT NULL UNIQUE,
			password VARCHAR(256) NOT NULL UNIQUE,
			created  DATE NOT NULL,
			last_visit DATE NOT NULL,
			PRIMARY KEY (id)
		);
		"""
		self.execute_query(query, self.db_name)

	def create_location_table(self):
		query = """
		CREATE TABLE IF NOT EXISTS Location (
			owner VARCHAR(20) CHARACTER SET utf8 NOT NULL,
			id INTEGER NOT NULL AUTO_INCREMENT,
			name VARCHAR(256) NOT NULL,
			latitude DECIMAL(12,10) NOT NULL,
			longitude DECIMAL(13,10) NOT NULL,
			marked BIT NOT NULL,
			notes TEXT NOT NULL,
			PRIMARY KEY (id, owner)
		);
		"""
		self.execute_query(query, self.db_name)

	def create_user(self, user, password):
		"""
		Creates a user for flask backend.
		"""
		query = "CREATE USER '{}'@'localhost' IDENTIFIED BY '{}';".format(user, password)
		self.execute_query(query)

	def add_privilege(self, user):
		"""
		Adds user privilege.
		"""
		query = "GRANT SELECT, INSERT, DELETE, UPDATE ON {}.* TO '{}'@'localhost';".format(self.db_name, user)
		self.execute_query(query)



if __name__ == '__main__':

	option, db_name, table_name, user_name, user_pass = None, None, None, None, None
	
	try:
		option = int(sys.argv[1])
	except IndexError:
		raise Exception("No option specified.\n1-create database\n2-create table\n3-delete table")
	try:
		db_name = sys.argv[2]
	except IndexError:
		raise Exception("No db name arg specified.")
	try:
		table_name = sys.argv[3]
	except IndexError:
		print("No table name specified, which is only needed for options 2 and 3.")
		pass

	if option == 4 or option == 6:
		try:
			user_name = os.environ.get('DB_USER') or input("Please enter a username: ")
			user_pass = os.environ.get('DB_PASS') or input("Please enter a password for {}: ".format(user_name))
		except IndexError:
			print("No user name specified, which is only needed for option 6.")
			pass

	print("Option: {},\nDB Name: {},\nTable Name: {}".format(option, db_name, table_name))

	dbh = DBHandler(db_name)

	if option == 1:
		print("Creating database: {}".format(db_name))
		dbh.create_database()
	elif option == 2:
		print("Creating {} table in {}".format(table_name, db_name))
		if table_name == 'user':
			dbh.create_user_table()
		elif table_name == 'location':
			dbh.create_location_table()
		else:
			raise Exception("Table name should be 'user' or 'location'.")
	elif option == 3:
		print("Deleting table: {}".format(table_name))
		dbh.delete_table(table_name)
	elif option == 4:
		print("Running full setup.\nCreating database.")
		dbh.create_database()
		print("Creating tables.")
		dbh.create_user_table()
		dbh.create_location_table()
		print("Creating user: {}".format(user_name))
		dbh.create_user(user_name, user_pass)
		dbh.add_privilege(user_name)
	elif option == 5:
		print("Removing database and tables.")
		dbh.delete_table('user')
		dbh.delete_table('location')
		dbh.delete_database()
	elif option == 6:
		print("Creating user: {}".format(user_name))
		dbh.create_user(user_name, user_pass)
		dbh.add_privilege(user_name)