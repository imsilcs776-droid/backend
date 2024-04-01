import axios from 'axios'
import { CONFLUENT } from '../constants/confluent'

enum REQUEST_OPT {
  POST = 'post',
  GET = 'get',
  PUT = 'put',
  DELETE = 'delete'
}

export class KsqlClient {
  options: any = {}

  async query(query: string) {
    this.options.url = `${CONFLUENT.KSQL_HOST}/ksql`
    this.options.headers = {
      'Accept': 'application/vnd.ksql.v1+json',
      'Content-Type': 'application/vnd.ksql.v1+json'
    }
    // this.options.url = CONFLUENT.HTTP_HOST + '/api/ksql/ksqldb1/ksql'
    this.options.method =  REQUEST_OPT.POST
    this.options.data = {
      "ksql": query,
      "streamsProperties": {
        "ksql.streams.auto.offset.reset": "earliest"
      }
    }
    console.log(this.options)
    return await axios(this.options)
      .then(res => {
        return res.data
      })
      .catch(err => {
        throw new Error(err.message || err)
      });
  }
}