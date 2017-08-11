const jjv = require('jjv')
// jsonSchema 校验,支持自定义格式与规则
// https://github.com/acornejo/jjv

// interface Validator {
//   defaultOptions: any
//   addSchema(id: string, schema: any)
//   addFormat(type: string, callback: Function)
//   addType(type: string, callback: Function)
//   addTypeCoercion(type: string, callback: Function)
//   validate(schema: any, data: any)
// }

const env = jjv()
// 关闭type预检查(校验前先进行自定义类型转换).
// env.defaultOptions.useCoerce = true
env.defaultOptions.checkRequired = true

let passwordValidate = (pwd) => {
  // 自定义password校验
  if (pwd.length < 8) {
    return false
  }
  let upperR = /[A-Z]/g
  let lowerR = /[a-z]/g
  let numR = /\d/g
  let tArr = [upperR.test(pwd), lowerR.test(pwd), numR.test(pwd)]
  if (tArr.every(v => v)) {
    return true
  }
  tArr.push(pwd.replace(upperR, '').replace(lowerR, '').replace(numR, '').length > 0)
  return tArr.filter(v => v).length >= 3
}
env.addFormat('password', passwordValidate)

// env.addType('date', (d) => {
//   return !isNaN(d.getTime())
// })

// env.addTypeCoercion('boolean', function (x) {
//   if (typeof x === 'boolean') {
//     return x
//   }
//   return !!x
// })

export const validator = env
export {passwordValidate}
