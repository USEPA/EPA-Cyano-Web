# FROM mysql:8.0
# FROM mysql:8.0.28-oracle
FROM mariadb:10.7.5

ENV APP_USER=mysql

# NOTE: Any scripts, .sql files, etc. copied here will be run prior to mysql server startup.
# COPY ./cyan_mysql/mysql-setup.sh /docker-entrypoint-initdb.d/mysql-setup.sh

# COPY ./cyan_mysql/my.cnf /etc/mysql/my.cnf

# RUN chmod +x /docker-entrypoint-initdb.d/mysql-setup.sh

# RUN adduser -S $APP_USER -G $APP_USER

# RUN chown $APP_USER:$APP_USER \
# 	/docker-entrypoint-initdb.d/mysql-setup.sh \
# 	/etc/mysql/my.cnf

RUN rm -rf /usr/local/bin/gosu

USER $APP_USER
