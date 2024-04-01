#!/bin/sh

npx mv-data-core schema snapshot -y ./snapshot.yaml

sed -i "s/max_length: -0.5/max_length: 255/g" ./snapshot.yaml
