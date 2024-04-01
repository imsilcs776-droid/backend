import axios from 'axios'
import queryString from 'query-string'
import { MQTT } from '../constants/mqtt'

enum REQUEST_OPT {
  POST = 'post',
  GET = 'get',
  PUT = 'put',
  DELETE = 'delete',
}

export class AxiosClient {
  options: any = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    auth: {
      username: MQTT.USERNAME,
      password: MQTT.PASSWORD,
    },
  }

  async get(url: string, query: any = null) {
    const qs =
      query !== null
        ? `?${queryString.stringify(query, { arrayFormat: 'bracket' })}`
        : ''
    this.options.url = `${url}?${qs}`
    this.options.method = REQUEST_OPT.GET

    console.log(this.options)
    return await axios(this.options)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.message || err)
      })
  }

  async post(url: string, body: any = {}) {
    this.options.url = MQTT.BROKER_HOST + ':' + MQTT.BROKER_PORT + url
    this.options.method = REQUEST_OPT.POST
    this.options.data = body

    console.log(this.options)
    return await axios(this.options)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.message || err)
      })
  }

  async put(url: string, body: any = {}) {
    this.options.url = url
    this.options.method = REQUEST_OPT.PUT
    this.options.data = body

    console.log(this.options)
    return await axios(this.options)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.message || err)
      })
  }

  async delete(url: string) {
    this.options.url = url
    this.options.method = REQUEST_OPT.DELETE

    console.log(this.options)
    return await axios(this.options)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.message || err)
      })
  }
}
