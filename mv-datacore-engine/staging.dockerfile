FROM mvdevops/nodejs-python:nodejs16-python3-slim 

WORKDIR /app

COPY .env.staging .env

COPY . .

RUN export PYTHON=$(which python3) \
&& yarn install

EXPOSE 8055

CMD [ "yarn", "start" ]
