
# # Builds a small nginx image with static website
FROM nginx:alpine

ARG config=nginx.conf

RUN rm -rf /usr/share/nginx/html/*

RUN rm /etc/nginx/conf.d/default.conf

COPY ./cyan_nginx/$config /etc/nginx/conf.d

# Uses "builder" image from docker/angular/Dockerfile
COPY --from=node-builder /app/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
