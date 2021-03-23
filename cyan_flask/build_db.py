"""
Builds tables for local DB that handles user account and user location information.
"""

import os
import sys
import getpass
import mysql.connector


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class DBHandler(object):
    """
	Database and table SQL commands with mysql.connector.
	"""

    def __init__(self, db_name, root_pass):
        self.db_name = db_name
        self.root_pass = root_pass
        self.tables = ["user", "location", "notifications"]

    def connect_to_db(self, db_name=None):
        conn = mysql.connector.connect(
            host=os.environ.get("DB_HOST"),
            port=os.environ.get("DB_PORT"),
            user="root",
            passwd=self.root_pass,
            buffered=True,
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
        return c

    def delete_table(self, table_name):
        query = """
		DROP TABLE IF EXISTS {};
		""".format(
            table_name
        )
        self.execute_query(query, self.db_name)

    def create_database(self):
        query = """
		CREATE DATABASE IF NOT EXISTS {};
		""".format(
            self.db_name
        )
        self.execute_query(query)

    def delete_database(self):
        query = """
		DROP DATABASE IF EXISTS {};
		""".format(
            self.db_name
        )
        self.execute_query(query)

    def create_user_table(self):
        query = """
		CREATE TABLE IF NOT EXISTS User (
			id INT(11) NOT NULL AUTO_INCREMENT,
			username VARCHAR(15) CHARACTER SET utf8 NOT NULL UNIQUE,
			email VARCHAR(50) NOT NULL UNIQUE,
			password VARCHAR(256) NOT NULL,
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
			type TINYINT NOT NULL DEFAULT 1,
			name VARCHAR(256) NOT NULL,
			latitude DECIMAL(12,10) NOT NULL,
			longitude DECIMAL(13,10) NOT NULL,
			marked BIT NOT NULL,
			compare BIT NOT NULL DEFAULT 0,
			notes TEXT NOT NULL,
			PRIMARY KEY (id, owner, type)
		);
		"""
        self.execute_query(query, self.db_name)

    def create_notifications_table(self):
        query = """
		CREATE TABLE IF NOT EXISTS Notifications (
			owner VARCHAR(20) CHARACTER SET utf8 NOT NULL,
			id INTEGER NOT NULL AUTO_INCREMENT,
			date DATETIME NOT NULL,
			subject VARCHAR(256) NOT NULL,
			body TEXT NOT NULL,
			is_new BIT NOT NULL,
			PRIMARY KEY (id, owner)
		);
		"""
        self.execute_query(query, self.db_name)

    def create_settings_table(self):
        query = """
		CREATE TABLE IF NOT EXISTS Settings (
			user_id INTEGER NOT NULL PRIMARY KEY,
			level_low INTEGER NOT NULL,
			level_medium INTEGER NOT NULL,
			level_high INTEGER NOT NULL,
			enable_alert BIT NOT NULL,
			alert_value INTEGER,
			FOREIGN KEY (user_id) REFERENCES User(id)
		);
		"""
        self.execute_query(query, self.db_name)

    def create_user(self, user, password, host="localhost"):
        """
		Creates a user for flask backend.
		"""
        query = "CREATE USER IF NOT EXISTS '{}'@'{}' IDENTIFIED BY '{}';".format(
            user, host, password
        )
        self.execute_query(query)
        self.add_privilege(user, host)

    def delete_user(self, user, host="localhost"):
        # query = "DROP USER IF EXISTS '{}'@'localhost';".format(user)
        query = "DROP USER '{}'@'{}';".format(user, host)
        self.execute_query(query)

    def add_privilege(self, user, host="localhost"):
        """
		Adds user privilege.
		"""
        query = "GRANT SELECT, INSERT, DELETE, UPDATE ON {}.* TO '{}'@'{}';".format(
            self.db_name, user, host
        )
        self.execute_query(query)

    def update_user_pass(self, user, newpass, host="localhost"):
        """
        Updates a user's password.
        """
        query = "ALTER USER '{}'@'{}' IDENTIFIED BY '{}'".format(user, host, newpass)
        self.execute_query(query)

    def build_table(self, table_name):
        if table_name == "user":
            self.create_user_table()
        elif table_name == "location":
            self.create_location_table()
        elif table_name == "notifications":
            self.create_notifications_table()
        elif table_name == "settings":
            self.create_settings_table()
        else:
            raise Exception(
                "Table name should be 'user', 'location', 'notifications', or 'settings'"
            )

    def full_build(self, user, password):
        print("Creating database: {}".format(self.db_name))
        self.create_database()
        print("Creating tables.")
        self.create_user_table()
        self.create_location_table()
        self.create_notifications_table()
        self.create_settings_table()
        print("Creating user: {}".format(user))
        self.create_user(user, password)
        print("Adding privilege to user {}".format(user))
        self.add_privilege(user)
        return True


if __name__ == "__main__":

    option, db_name, table_name, user_name, user_pass, root_pass = (
        None,
        None,
        None,
        None,
        None,
        None,
    )

    options = """
	1. Create a database.
	2. Create a specific table.
	3. Delete a specific table.
	4. Run full database and table creation.
	5. Deletes database and tables.
	6. Creates a user.
	"""

    try:
        option = int(sys.argv[1])
    except IndexError:
        print("Options:\n{}".format(options))
        option = int(input("\nEnter an option from above: "))
    try:
        db_name = sys.argv[2]
    except IndexError:
        db_name = os.environ.get("DB_NAME") or input("\nEnter database name: ")
    try:
        table_name = sys.argv[3]
    except IndexError:
        if option == 2 or option == 3:
            table_name = input("\nEnter table name: ")

    if option == 4 or option == 6:
        # Options that involve user creation
        try:
            user_name = os.environ.get("DB_USER") or input(
                "Please enter a username to be created: "
            )
            user_pass = os.environ.get("DB_PASS") or input(
                "Please enter a password for {}: ".format(user_name)
            )
        except IndexError:
            print("No user name specified, which is only needed for option 6.")

    # MySQL root password (used for most db operations):
    root_pass = os.environ.get("MYSQL_ROOT_PASSWORD") or getpass.getpass(
        "Please enter root password for database: "
    )

    print(
        "Option: {},\nDB Name: {},\nTable Name: {}".format(option, db_name, table_name)
    )

    dbh = DBHandler(db_name, root_pass)

    if option == 1:
        print("Creating database: {}".format(db_name))
        dbh.create_database()
    elif option == 2:
        print("Creating {} table in {}".format(table_name, db_name))
        dbh.build_table(table_name)
    elif option == 3:
        print("Deleting table: {}".format(table_name))
        dbh.delete_table(table_name)
    elif option == 4:
        print("Running full setup.")
        dbh.full_build(user_name, user_pass)
    elif option == 5:
        print("Removing database and tables.")
        dbh.delete_database()
    elif option == 6:
        print("Creating user: {}".format(user_name))
        dbh.create_user(user_name, user_pass)
        dbh.add_privilege(user_name)

    print("Done.")
