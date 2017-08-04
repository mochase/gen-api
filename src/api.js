import {Once} from'./utils/once'
import {validator} from './utils/validator'
const once = new Once('api')
const hash = require('object-hash')


// type Lang = 'zh-CN' | 'en'
// interface ApiResponse {
// }
export const ERR_NO_SESSION = 'no session'
// export interface ApiConfig {
//   url: string
//   method?: 'POST' | 'GET' | 'DELETE' | 'PUT'
//   options?: {
//     cached?: boolean | number
//     withCredentials?: boolean
//     responseSchema?: any
//     requestSchema?: any
//   }
// }
// interface ApiIns<I, O> {
//   (requestBody: I, token: string, lang: Lang): Promise<O>
// }
// interface ApiFactory {
//   <O>(conf: ApiConfig): ApiIns<null, O>
//   <I, O>(conf: ApiConfig): ApiIns<I, O>
// }

export const genApi = (conf) => {
  let {url: apiUrl, method: apiMethod = 'GET', options = {}} = conf
  let {cached = false, withCredentials = false, responseSchema = null, requestSchema = null} = options
  let reqValidate = false
  // schema 校验
  if (requestSchema) {
    reqValidate = hash(requestSchema)
    validator.addSchema(reqValidate, requestSchema)
  }
  let respValidate = false
  if (responseSchema) {
    respValidate = hash(responseSchema)
    validator.addSchema(respValidate, responseSchema)
  }
  let api = {
    method: apiMethod.toUpperCase(),
    url: apiUrl,
    withCredentials,
    cached,
    reqValidate,
    respValidate
  }
  return (requestBody = null, authorization = '', lang = 'zh-CN') => {
    let {method = 'GET', url, withCredentials, reqValidate, respValidate} = api
    if (reqValidate) {
      let errors
      try {
        errors = validator.validate(reqValidate, requestBody)
      } catch (err) {
        errors = err
      }
      if (errors) {
        console.warn('request body invalid', apiUrl, errors, requestBody)
        if (DEBUG) {
          debugger
        }
        // requestSchema 验证失败
        return Promise.reject(errors)
      }
    }
    let headers = new Headers()
    headers.set('Accept-Language', lang)
    /**
     * 自定义header
     * ...
     * ...
     */
    let body

    if (requestBody) {
      switch (method) {
        case 'GET':
          url += '?' + Object.keys(requestBody).map(k => {
              return k + '=' + requestBody[k]
            }).join('&')
          break
        default:
          headers.set('Content-Type', 'application/json')
          body = JSON.stringify(requestBody)
          break
      }
    }
    let id = api.url + '||' + hash({
        method: api.method,
        url: api.url,
        requestBody,
        lang
      })

    return once.do(id, async () => {
      let ret = (async () => {
        let isLogin = false
        try {
          if (authorization) {
            // Auth2.0
            // ???
            headers.set('Authorization', authorization)
            isLogin = true
          }
        } catch (err) {
          // nothing
          isLogin = false
        }

        //  check login
        if (withCredentials && !isLogin) {
          await Promise.reject(ERR_NO_SESSION)
          return
        }

        let response
        let request = new Request(url, {
          method,
          headers,
          body
        })
        let resp = await fetch(request);
        response = await resp.json()

        if (respValidate) {
          let errors
          try {
            errors = validator.validate(respValidate, response)
          } catch (err) {
            errors = err
          }
          if (errors) {
            console.warn('response body invalid', apiUrl, errors, response)
            if (DEBUG) {
              debugger
            }
            await Promise.reject(errors)
            return
          }
        }
        return await Promise.resolve(response)
      })()

      ret.catch(err => {
        // 通用异常处理
        console.error(err)
      })

      return ret
    }, cached)
  }
}

