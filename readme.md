# Datacore V2

> node version: 18.0.0

## Installing

```bash
# install node module
$ yarn 
```

## Endpoint Directory

```text
.
├── endpoints-extension
│   └── <enpoint-name>
│       └── index.ts
└── mv-datacore-engine
    └── extensions
        └── endpoints
            └── <enpoint-name>
                └── index.js

```
### build setiap context
```bash
# setelah install node_module
# lakukan development di masing masing endpoint di dalam folder endpoints-extension
$ cd endpoints-extension/<enpoint-name>

# setelah selesai maka silahkah di build
$ yarn build
```
> build file akan di masukan di dalam folder  
> ./endpoints-extension/mv-datacore-engine/extensions/endpoints/context

### running project
```bash
# setelah melakuakan build di masing masing endpoint
# masuk folder mv-datacore-engine
$ cd mv-datacore-engine/

# running dev
$ yarn dev
```
> !!buka api document di 
> http://0.0.0.0:8055/explorer/rapi-docs

### build docker
```bash
# masuk folder mv-datacore-engine
$ cd mv-datacore-engine/

# build docker
$ yarn build
```
