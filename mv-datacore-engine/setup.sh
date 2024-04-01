#!/bin/sh

npx mv-data-core bootstrap
npx mv-data-core schema apply -y snapshot.yaml
npx mv-data-core database seed:all
