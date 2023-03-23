FROM node:16-alpine

WORKDIR /app

COPY . /app/

EXPOSE 7000

RUN ["npm", "install"]


ENTRYPOINT [ "npm", "start" ]