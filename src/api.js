import {Once} from'./utils/once'
import {validator} from './utils/validator'
const once = new Once('api')
const hash = require('object-hash')


// type Lang = 'zh-CN' | 'en'
export const ERR_NO_SESSION = 'no session'
// export interface ApiConfig {
//   url: string
//   method?: 'POST' | 'GET' | 'DELETE' | 'PUT'
//   options?: {
//     cached?: boolean | number
//     withCredentials?: boolean
//     responseSchema?: any
//     requestSchema?: any


export const genApi = (conf) => {
  let {url: apiUrl, method: apiMethod = 'GET', options = {}} = conf
  let {cached = false, withCredentials = false, responseSchema = null, requestSchema = null} = options

  let reqSchemaId = ''
  if (requestSchema) {
    // jjv, 注册schema
    reqSchemaId = hash(requestSchema)
    validator.addSchema(reqSchemaId, requestSchema)

  }
  let _config = {
    method: apiMethod.toUpperCase(),
    url: apiUrl,
    withCredentials,
    cached,
    reqSchemaId
  }

  return (requestBody = null, authorization = '', lang = 'zh-CN') => {
    let {method, url, withCredentials, reqSchemaId} = _config
    if (reqSchemaId) {
      let errors
      try {
        errors = validator.validate(reqSchemaId, requestBody)
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
      return Promise.reject(ERR_NO_SESSION)
    }

    let id = _config.url + '||' + hash({
      method: _config.method,
      url: _config.url,
      requestBody,
      lang
    })
    
    return once.do(id, async () => {
      try {
        let request = new Request(url, {
          method,
          headers,
          body
        })    
        let resp = await fetch(request);
        let response = await resp.json()

        let respSchemaId = ''
        if (responseSchema) {
          respSchemaId = hash(responseSchema)
          validator.addSchema(respSchemaId, responseSchema)
        } 
        if (respSchemaId) {
          let errors
          try {
            errors = validator.validate(respSchemaId, response)
          } catch (err) {
            errors = err
          }
          if (errors) {
            console.warn('response body invalid', apiUrl, errors, response)
            if (DEBUG) {
              // debugger
            }
            return await Promise.reject(errors)
          }
        }
        return await Promise.resolve(response)
      } catch (error) {
        // 通常异常处理
        console.error(err)
      }
    }, cached)
  }
}

