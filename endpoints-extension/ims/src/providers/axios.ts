import axios from 'axios'
import queryString from 'query-string'
import { configuration } from '../constant/mdm'

enum REQUEST_OPT {
  POST = 'post',
  GET = 'get',
  PUT = 'put',
  DELETE = 'delete',
}

export class AxiosClient {
  options: any = {
    method: 'get',
    maxBodyLength: Infinity,
    headers: {
      'api-key': 'G6yWWoVBrQ0V2JKzd06IGPiqb24GYtS0',
      'Content-Type': 'application/json',
    },
    data: configuration,
  }

  async getAtasan(nippNew: string) {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://pelindo-hub.pelindo.co.id/api/peo/AtasanBawahan/all?search=${nippNew}`,
      headers: {
        'api-key': 'G6yWWoVBrQ0V2JKzd06IGPiqb24GYtS0',
        'Content-Type': 'application/json',
      },
      data: configuration,
    }

    return await axios
      .request(config)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.message || err)
      })
  }

  async post(url: string, body: any = {}) {
    this.options.url = url
    this.options.method = REQUEST_OPT.POST
    this.options.data = JSON.parse(body)

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
