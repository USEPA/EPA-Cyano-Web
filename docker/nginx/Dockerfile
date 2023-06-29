# # Builds a small nginx image with static website
# FROM nginx:stable-alpine
# FROM nginx:stable-alpine
FROM nginx:stable

ARG config=nginx.conf

# ENV APP_USER=www-data

# RUN apk update && \
# 	apk upgrade

RUN rm -rf /usr/share/nginx/html/* && \
	rm /etc/nginx/conf.d/default.conf

COPY ./docker/nginx/nginx.conf /etc/nginx/conf.d

# Uses "node-builder" image from docker/angular/Dockerfile
# COPY --from=node-builder /app/dist /usr/share/nginx/html
COPY --from=ghcr.io/usepa/cyanweb-angular:dev-kube /app/dist /usr/share/nginx/html

# RUN adduser -S $APP_USER -G $APP_USER && \
# 	chown -R $APP_USER:$APP_USER /usr/share/nginx && \
#     chown -R $APP_USER:$APP_USER /var/cache/nginx && \
#     chown -R $APP_USER:$APP_USER /var/log/nginx && \
#     chown -R $APP_USER:$APP_USER /etc/nginx/conf.d

# RUN touch /var/run/nginx.pid && \
# 	chown -R $APP_USER:$APP_USER /var/run/nginx.pid

# USER $APP_USER

# CMD ["nginx", "-g", "daemon off;"]
