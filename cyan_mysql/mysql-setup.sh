#!/bin/sh

dump_file="/tmp/dump.sql"
file_size=$(find "$dump_file" -printf "%s")

echo "The value for SQL_DUMP is ${SQL_DUMP}."
echo "The file size for potential sql dump file is ${file_size}."

# TODO: Add 3rd case - existing DB on host at /var/lib/mysql (e.g., VM deploys, prod, etc.)

if (( file_size > 0 )); then
	echo "SQL_DUMP env var provided, building database with this file."
	mysql -u root -p${MYSQL_ROOT_PASSWORD} < ${dump_file}
else
	echo "Building fresh ${DB_NAME} database instance with User, Location and Notifications tables."
	# Creates database:
	mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"
# 	# Creates user table:
# 	mysql -u root -p${MYSQL_ROOT_PASSWORD} -D ${DB_NAME} -e \
# 	"CREATE TABLE IF NOT EXISTS User (
# 		id INTEGER NOT NULL AUTO_INCREMENT,
# 		username VARCHAR(20) CHARACTER SET utf8 NOT NULL UNIQUE,
# 		email VARCHAR(50) NOT NULL UNIQUE,
# 		password VARCHAR(300) NOT NULL UNIQUE,
# 		created  DATE NOT NULL,
# 		last_visit DATE NOT NULL,
# 		PRIMARY KEY (id)
# 	);"
# 	# Creates location table:
# 	mysql -u root -p${MYSQL_ROOT_PASSWORD} -D ${DB_NAME} -e \
# 	"CREATE TABLE IF NOT EXISTS Location (
# 		owner VARCHAR(20) CHARACTER SET utf8 NOT NULL,
# 		id INTEGER NOT NULL AUTO_INCREMENT,
# 		type TINYINT NOT NULL DEFAULT 1,
# 		name VARCHAR(256) NOT NULL,
# 		latitude DECIMAL(12,10) NOT NULL,
# 		longitude DECIMAL(13,10) NOT NULL,
# 		marked BIT NOT NULL,
# 		compare BIT NOT NULL DEFAULT 0,
# 		notes TEXT NOT NULL,
# 		PRIMARY KEY (id, owner, type)
# 	);"
# 	# Creates notifications table:
# 	mysql -u root -p${MYSQL_ROOT_PASSWORD} -D ${DB_NAME} -e \
# 	"CREATE TABLE IF NOT EXISTS Notifications (
# 		owner VARCHAR(20) CHARACTER SET utf8 NOT NULL,
# 		id INTEGER NOT NULL AUTO_INCREMENT,
# 		date DATETIME NOT NULL,
# 		subject VARCHAR(256) NOT NULL,
# 		body TEXT NOT NULL,
# 		is_new BIT NOT NULL,
# 		PRIMARY KEY (id, owner)
# 	);"
# 	# Creates settings table:
# 	mysql -u root -p${MYSQL_ROOT_PASSWORD} -D ${DB_NAME} -e \
# 	"CREATE TABLE IF NOT EXISTS Settings (
# 		user_id INTEGER NOT NULL PRIMARY KEY,
# 		level_low INTEGER NOT NULL,
# 		level_medium INTEGER NOT NULL,
# 		level_high INTEGER NOT NULL,
# 		enable_alert BIT NOT NULL,
# 		alert_value INTEGER,
# 		FOREIGN KEY (user_id) REFERENCES User(id)
# 	);"
fi

# Creating user for connecting to mysql cyan-responsive database:
echo "Creating DB user."
mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASS}';"
mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "GRANT SELECT, INSERT, DELETE, UPDATE ON ${DB_NAME}.* TO '${DB_USER}'@'%';"