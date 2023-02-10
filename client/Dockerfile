# syntax=docker/dockerfile:1


FROM node:latest


WORKDIR /dir

COPY ["package.json", "./"]

RUN npm install 
#--production

COPY . .
ENV NODE_ENV=production
RUN npm run build

# CMD [ "npm" ,"start" ]