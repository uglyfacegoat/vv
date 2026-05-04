FROM golang:1.25-alpine AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/api ./cmd/api

FROM alpine:3.22

WORKDIR /app

COPY --from=build /out/api /app/api
COPY database/migrations /app/database/migrations

ENV PORT=8080
ENV MIGRATIONS_DIR=/app/database/migrations

EXPOSE 8080

CMD ["/app/api"]
