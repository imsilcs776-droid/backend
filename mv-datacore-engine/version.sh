#!/bin/sh

npm version | grep data-core | cut -d ":" -f 2 | sed -e 's/ //g' -e 's/,//g' -e "s|'||g"