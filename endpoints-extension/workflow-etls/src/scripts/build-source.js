const fs = require('fs')
const utils = require('util')

execAsync = utils.promisify(require('child_process').exec)

const getDir = (dir) => {
  return fs
    .readdirSync(dir)
    .flatMap((item) => {
      const path = `${dir}/${item}`
      if (fs.statSync(path).isDirectory()) {
        return item
      }

      return false
    })
    .filter((item) => item)
}

const init = async () => {
  const targetDirs = getDir('./src/confluent-client')

  console.log(`starting build!!`)
  for (const item of targetDirs) {
    const command = `yarn directus-extension build --input ./src/confluent-client/${item}/index.ts --output ../../mv-datacore-engine/extensions/endpoints/workflow-etl-${item}/index.js`
    console.log(`building ${item} ...`)
    await execAsync(command)
    console.log(`build ${item} done!`)
  }
}

init()
