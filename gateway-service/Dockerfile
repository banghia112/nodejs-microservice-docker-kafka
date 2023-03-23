FROM node:16-alpine

# expose port

EXPOSE 3000

# specify working directory

WORKDIR /app

# copy from build context to working directory

COPY . .

# runs then commit to new layer (in build stage)

RUN ["npm", "install"]

# runs when container is started but can be overwrite

# CMD [ "npm", "install" ]

# runs when container is started but can not be overwrite

ENTRYPOINT [ "npm", "start" ]
