import { Once } from './utils/once'
import { validator } from './utils/validator'
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

export const authorization = ''
export const lang = 'zh-CN'


export const genApi = (config) => {
    let {
        url: apiUrl,
        method = 'GET',
        options: {
            cached = false, 
            withCredentials = false, 
            responseSchema = null, 
            requestSchema = null
        }
    } = config
    method = method.toUpperCase()

    let reqSchemaId = ''
    if (requestSchema) {
        reqSchemaId = hash(requestSchema)
        validator.addSchema(reqSchemaId, requestSchema)
    }

    let respSchemaId = ''
    if (responseSchema) {
        respSchemaId = hash(responseSchema)
        validator.addSchema(respSchemaId, responseSchema)
    }

    return (requestBody = null) => {
        let body, url = apiUrl
        let id = url + '||' + hash({
            method,
            url,
            requestBody,
            lang
        })

        const fn = async function () {
            if (reqSchemaId) {
                let errors
                try {
                    errors = validator.validate(reqSchemaId, requestBody)
                } catch (err) {
                    errors = err
                }
                if (errors) {
                    console.warn('request body invalid', apiUrl, errors, requestBody)
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
    
            if (authorization) {
                // set auth token
                headers.set('Authorization', authorization)
            }
            if (withCredentials && !authorization) {
                return Promise.reject(ERR_NO_SESSION)
            }
            let request = new Request(url, {
                method,
                headers,
                body
            })
            let resp = await fetch(request);
            let response = await resp.json()
            if (respSchemaId) {
                let errors
                try {
                    errors = validator.validate(respSchemaId, response)
                } catch (err) {
                    errors = err
                }
                if (errors) {
                    console.warn('response body invalid', apiUrl, errors, response)
                    return Promise.reject(errors)
                }
            }
            return Promise.resolve(response)
        }

        return once.do(id, fn, cached).catch(e => {
            console.error(e)
        })
    }
}