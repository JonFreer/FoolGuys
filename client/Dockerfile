# syntax=docker/dockerfile:1


FROM node:latest
ENV NODE_ENV=production

WORKDIR /dir

COPY ["package.json", "./"]

RUN npm install 
#--production

COPY . .

RUN npm run build

# CMD [ "npm" ,"start" ]