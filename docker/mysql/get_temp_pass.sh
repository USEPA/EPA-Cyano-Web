#!/bin/sh

docker-compose logs cyan-db 2>&1 | grep GENERATED
echo
echo "1. Copy randomly generated password for updating DB"
echo
echo "2. Run 'docker-compose exec cyan-db mysql -uroot -p'"
echo
echo "3. Use password from 1. to log into mysql session."
echo
echo "4. Update root password for environment: 'set password for 'root'@'<the host>' = '<the password>';' or 'SET PASSWORD FOR 'root'@'localhost' = PASSWORD('New_Password');'"
echo
