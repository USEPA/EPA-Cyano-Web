FROM mariadb:10.7.5

ENV APP_USER=mysql

# For Prisma scans:
RUN apt-get update && \
	apt-get install -y openssl libksba8

RUN rm -rf /usr/local/bin/gosu

USER $APP_USER
