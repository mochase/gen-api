import { genApi } from '../src/api.js'
// 本地有代理服务，免得 CORS
const url = 'https://api.github.com/repos/mochase/gen-api'
const options = {
    cached: true,
    withCredentials: false,
    requestSchema: require('./req-schema.yaml'),
    responseSchema: require('./resp-schema.yaml')
}
const method = 'GET'

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

// 请求参数错误
getIpInfo({
    page: 0, per_page: 0
  }).then(data => {
      console.log(data)
  })

// 相同的请求只发送一次
setTimeout(() => {
    getIpInfo(sameReq)
        .then(data => {
            console.log('No.2 request', data)
        })
}, 2000)


