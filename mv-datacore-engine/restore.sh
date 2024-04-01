#!/bin/sh

npx mv-data-core bootstrap --skipAdminInit
npx mv-data-core schema apply -y ./snapshot.yaml
# npx directus schema apply -y ./snapshot.yaml
