#################### dev image ######################################
# FROM mysql:8.0

# # NOTE: Any scripts, .sql files, etc. copied here will be run prior to mysql server startup.
# COPY ./cyan_mysql/mysql-setup.sh /docker-entrypoint-initdb.d/mysql-setup.sh

# COPY ./cyan_mysql/my.cnf /etc/mysql/my.cnf

# RUN chmod +x /docker-entrypoint-initdb.d/mysql-setup.sh
#####################################################################



################## dev-kube image ######################
FROM mariadb:10.7.5

ENV APP_USER=mysql

RUN rm -rf /usr/local/bin/gosu

USER $APP_USER