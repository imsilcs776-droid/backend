const knex = require('knex')
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const colors = require('colors');
const cmdargs = require('command-line-args')

const {
  env: {
    DB_CLIENT,
    DB_HOST,
    DB_PORT,
    DB_DATABASE,
    DB_USER,
    DB_PASSWORD
  }
} = process

const main = async () => {
  const args = cmdargs([
    {
      name: 'generate',
      alias: 'g',
      type: Boolean,
    },
    {
      name: 'name',
      alias: 'n',
      type: String,
    },
    {
      name: 'revert',
      alias: 'r',
      type: Number,
    },
    {
      name: 'revert-all',
      type: Boolean,
    },
    {
      name: 'help',
      alias: 'h',
      type: Boolean,
    },
  ])

  const knexInstance = knex({
    client: DB_CLIENT,
    connection: {
      host : DB_HOST,
      port : DB_PORT ? +DB_PORT : 1443,
      user : DB_USER,
      password : DB_PASSWORD,
      database : DB_DATABASE
    }
  })

  try {
    await knexInstance.schema.createTable('seeder_metadatas', (table) => {
      table.string('name');
    });
  } catch (error) {}

  const currentSeederDatas = (await knexInstance.select('*').from('seeder_metadatas')).map((seederData) => seederData.name)

  const seeders = fs.readdirSync(path.resolve(__dirname, '..', 'seeders'))

  if (args.name) {
    if (args.generate) {
      // generate seed
      const now = new Date()
      const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`
      fs.writeFileSync(path.resolve(__dirname, '..', 'seeders', `${timestamp}-${args.name}.js`), 'module.exports = {\n\tasync up(knex) {\n\t\t// on seed up\n\n\t},\n\n\tasync down(knex) {\n    // on seed revert\n\t\t\n\t},\n};\n')
    } else {
      // run one seed
      if (!currentSeederDatas.includes(args.name)) {
        try {
          const pathFile = path.resolve(__dirname, '..', 'seeders', args.name)
          const seederInstance = require(pathFile)
          await seederInstance.up(knexInstance)
          console.log(colors.green(`[Seed ${args.name} successfully]`))
          await knexInstance('seeder_metadatas').insert([{ name: args.name }])
        } catch(e) {
          console.log(colors.red(`[Failed to seed ${args.name}]`))
          console.log(`=> ${e.toString()}`)
        }
      }
    }
  } else if (args.revert) {
    // revert some seed
    for (let i = 0; i < args.revert; i++) {
      const currentRevertFile = currentSeederDatas[currentSeederDatas.length - 1 - i]
      if (currentRevertFile) {
        try {
          const revertFile = path.resolve(__dirname, '..', 'seeders', currentRevertFile)
          const revertInstance = require(revertFile)
          await revertInstance.down(knexInstance)
          await knexInstance('seeder_metadatas').where('name', currentRevertFile).del()
          console.log(colors.green(`[Seed ${currentRevertFile} successfully reverted]`))
        } catch (e) {
          console.log(colors.red(`[Failed to revert ${currentRevertFile}]`))
          console.log(`=> ${e.toString()}`)
        }
      }
    }
      
  } else if (args['revert-all']) {
    // revert all seed
    const reverseSeeedDatas = currentSeederDatas.reverse()
    for (const currentRevertFile of reverseSeeedDatas) {
      try {
        const revertFile = path.resolve(__dirname, '..', 'seeders', currentRevertFile)
        const revertInstance = require(revertFile)
        await revertInstance.down(knexInstance)
        await knexInstance('seeder_metadatas').where('name', currentRevertFile).del()
        console.log(colors.green(`[Seed ${currentRevertFile} successfully reverted]`))
      } catch (e) {
        console.log(colors.red(`[Failed to revert ${currentRevertFile}]`))
        console.log(`=> ${e.toString()}`)
      }
    }
      
  } else if (args.help) {
    console.log('!!Welcome to my seeder!!\nYou can use this options:\n\n--name-n      : to seed specified file (with extension)\n                add --generate or -g to generate new seed file\n\n--revert -r n : to revert some seed, n is total file to revert from backward\n\n--revert-all  : to revert all seed from backward\n\n--help -h     : show this help\n\nNote: if none arguments it will be seed all file')
  } else {
    for (const seeder of seeders) {
      const pathFile = path.resolve(__dirname, '..', 'seeders', seeder)
      const seederInstance = require(pathFile)
      if (!currentSeederDatas.includes(seeder) && seeder.includes('.js')) {
        try {
          await seederInstance.up(knexInstance)
          console.log(colors.green(`[Seed ${seeder} successfully]`))
          await knexInstance('seeder_metadatas').insert([{ name: seeder }])
        } catch(e) {
          console.log(colors.red(`[Failed to seed ${seeder}]`))
          console.log(`=> ${e.toString()}`)
        }
      }
    }
  }

  process.exit(0)
}

main()
