
FROM golang:1.26

WORKDIR /app

COPY backend/go.mod backend/go.sum ./backend/
RUN cd backend && go mod download

COPY . .

RUN cd backend && go build ./...

WORKDIR /app
