FROM mariadb:11.3.2

ENV APP_USER=mysql

# For Prisma scans:
RUN apt-get update && \
	apt-get upgrade -y openssl libksba8

# For Prisma scans:
RUN rm -rf /usr/local/bin/gosu

USER $APP_USER
