import 'dotenv/config'

const BROKER_HOST = process.env.MQTT_BROKER_HOST
const BROKER_PORT = process.env.MQTT_BROKER_PORT || ''
const USERNAME = process.env.MQTT_USERNAME || 'admin'
const PASSWORD = process.env.MQTT_PASSWORD || 'public'

export const MQTT = {
  BROKER_HOST,
  BROKER_PORT,
  USERNAME,
  PASSWORD,
}
