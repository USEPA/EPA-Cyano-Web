FROM redis:7.0.15-alpine3.19

COPY --from=golang:1.22.0 /usr/local/go /usr/local/go
ENV PATH="/usr/local/go:${PATH}"

RUN apk update && \
	apk upgrade

