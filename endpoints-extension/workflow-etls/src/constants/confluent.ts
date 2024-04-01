import 'dotenv/config'

const confluenceHost = process.env.WORKFLOW_HOST
const confluencePort = process.env.WORKFLOW_CP_SERVER_PORT
const connectPort = process.env.WORKFLOW_CONNECT_PORT
const ksqlPort = process.env.WORKFLOW_KSQL_PORT

export const CONFLUENT = {
  HTTP_HOST : `${confluenceHost}:${confluencePort}`,
  CONNECT_HOST : `${confluenceHost}:${connectPort}`,
  KSQL_HOST : `${confluenceHost}:${ksqlPort}`,
  HOST : confluenceHost,
  CP_SERVER_PORT : connectPort,
}
