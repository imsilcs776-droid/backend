FROM nikolaik/python-nodejs:python3.8-nodejs18-slim

WORKDIR /app

COPY .env.staging .env
COPY . .

# Install build dependencies untuk node-gyp (make, gcc, g++, dll)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  python3-dev \
  libmagic-dev \
  && rm -rf /var/lib/apt/lists/*

RUN yarn install --ignore-engines --frozen-lockfile --network-timeout 100000

EXPOSE 8055

CMD ["yarn", "start"]
