# FROM mvdevops/nodejs-python:nodejs16-python3-slim
FROM nikolaik/python-nodejs:python3.8-nodejs18-slim

WORKDIR /app

COPY .env.staging .env

COPY . .

RUN apt-get update && apt-get install build-essential -y
RUN export PYTHON=$(which python3) \
  && yarn install

EXPOSE 8055

CMD [ "yarn", "start" ]
