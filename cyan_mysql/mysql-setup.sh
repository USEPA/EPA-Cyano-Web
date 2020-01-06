#!/bin/sh

dump_file="/tmp/dump.sql"
file_size=$(find "$dump_file" -printf "%s")

echo "The value for SQL_DUMP is ${SQL_DUMP}"
echo "The file size for potential sql dump file is ${file_size}"

# TODO: Add 3rd case - existing DB on host at /var/lib/mysql (e.g., VM deploys, prod, etc.)

if (( file_size > 0 )); then
	echo "SQL_DUMP env var provided, building database with this file."
	mysql -u root -p${MYSQL_ROOT_PASSWORD} < ${dump_file}
else
	echo "Building fresh ${DB_NAME} database instance with User and Location tables."
	# Creates database:
	mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"
	# Creates user table:
	mysql -u root -p${MYSQL_ROOT_PASSWORD} -D ${DB_NAME} -e \
	"CREATE TABLE IF NOT EXISTS User (
		id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
		username VARCHAR(20) CHARACTER SET utf8 NOT NULL UNIQUE,
		email VARCHAR(50) NOT NULL UNIQUE,
		password VARCHAR(300) NOT NULL UNIQUE,
		created  DATE NOT NULL,
		last_visit DATE NOT NULL
	);"
	# Creates location table:
	mysql -u root -p${MYSQL_ROOT_PASSWORD} -D ${DB_NAME} -e \
	"CREATE TABLE IF NOT EXISTS Location (
		owner VARCHAR(20) CHARACTER SET utf8 NOT NULL,
		id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(256) NOT NULL,
		latitude DECIMAL(12,10) NOT NULL,
		longitude DECIMAL(13,10) NOT NULL,
		marked BIT NOT NULL,
		notes TEXT NOT NULL
	);"
	# Creates notifications table:
	mysql -u root -p${MYSQL_ROOT_PASSWORD} -D ${DB_NAME} -e \
	"CREATE TABLE IF NOT EXISTS Notifications (
		owner VARCHAR(20) CHARACTER SET utf8 NOT NULL,
		id INTEGER NOT NULL AUTO_INCREMENT,
		date DATETIME NOT NULL,
		subject VARCHAR(256) NOT NULL,
		body TEXT NOT NULL,
		is_new BIT NOT NULL,
		PRIMARY KEY (id, owner)
	);"
fi

# Creating user for connecting to mysql cyan-responsive database:
echo "Creating DB user."
mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "CREATE USER '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASS}';"
mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "GRANT SELECT, INSERT, DELETE, UPDATE ON ${DB_NAME}.* TO '${DB_USER}'@'%';"