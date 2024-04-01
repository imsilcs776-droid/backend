const fs = require("fs");
const os = require("os");
const path = require("path");
const axios = require('axios')
require('dotenv').config()
const { CollectionsService, ItemsService } = require('directus')

const PORT = process.env.PORT ? +process.env.PORT : 3000
const USERNAME = process.env.ADMIN_USERNAME || "admin@example.com"
const PASSWORD = process.env.ADMIN_PASSWORD || "12345"

const envFilePath = path.resolve(__dirname,"..", ".env");

const readEnvVars = () => fs.readFileSync(envFilePath, "utf-8").split(os.EOL);

const getEnvValue = (key) => {
  const matchedLine = readEnvVars().find((line) => line.split("=")[0] === key);
  return matchedLine !== undefined ? matchedLine.split("=")[1] : null;
};

const setEnvValue = (key, value) => {
  const envVars = readEnvVars();
  const targetLine = envVars.find((line) => line.split("=")[0] === key);
  if (targetLine !== undefined) {
    const targetLineIndex = envVars.indexOf(targetLine);
    envVars.splice(targetLineIndex, 1, `${key}="${value}"`);
  } else {
    envVars.push(`${key}="${value}"`);
  }
  fs.writeFileSync(envFilePath, envVars.join(os.EOL));
};

const main = async () => {
  try {
    const BASE_URL = `http://localhost:${PORT}`
    const {
      data: {
        data: {
          access_token
        }
      }
    } = await axios.post(`${BASE_URL}/auth/login`, {
      email: USERNAME,
      password: PASSWORD
    })

    const {
      data: {
        data: {
          id,
          role
        }
      }
    } = await axios({
      method: "get",
      url: `${BASE_URL}/users/me`,
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    })

    setEnvValue('ADMIN_ID', id)
    setEnvValue('ADMIN_ROLE', role)

  } catch (error) {
    console.error(error)
  }
}

main()
