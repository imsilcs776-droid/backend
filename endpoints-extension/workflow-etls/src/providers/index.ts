import { AxiosClient } from "./axios"
import { KsqlClient } from "./ksql"

export default {
  providerClient: new AxiosClient(),
  ksqlClient : new KsqlClient()
}