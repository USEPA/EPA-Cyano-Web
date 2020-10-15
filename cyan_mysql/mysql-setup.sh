#!/bin/sh

dump_file="/tmp/dump.sql"
file_size=$(find "$dump_file" -printf "%s")

echo "The value for SQL_DUMP is ${SQL_DUMP}."
echo "The file size for potential sql dump file is ${file_size}."