import {
    genApi
} from '../src/api.js'

// const url = 'https://api.github.com/repos/hjin-me/gen-api/events'
// 本地有代理服务，免得 CORS
const url = 'https://api.github.com/repos/hjin-me/gen-api/events'
const options = {
    cached: true,
    withCredentials: false,
    requestSchema: require('./req-schema.yaml'),
    responseSchema: require('./resp-schema.yaml')
}
const method = 'GET'

// 这里配置 Authorization 头的内容
const authorization = ''
const lang = 'zh-CN'


const getIpInfo = genApi({
    url,
    method,
    options
})

let sameReq = {
    page: 1,
    per_page: 2
}
getIpInfo(sameReq)
    .then(data => {
        console.log('No.1 request:', data)
    })

// 相同的请求只发送一次
getIpInfo(sameReq)
    .then(data => {
        console.log('No.2 request', data)
    }).catch(err => {
        console.error(err)
    })

// 请求参数错误
// getIpInfo({
//   page: 0, per_page: 0
// }, authorization, lang).catch(err => {
//   // console.debug('json validate', err)
//   console.error(err)
// })

setTimeout(() => {
    // 5 秒后查询，从缓存查询，不发送网络请求
    getIpInfo(sameReq)
        .then(data => {
            console.log('No.3 request', data)
        })
}, 5000)