import Dexie from 'dexie'
import {cloneDeep} from 'lodash'
export const ERR_ID = 'id should be string'
export const ERR_DATA_EXPIRED = 'data expired'

// interface itemRecord {
//   id: string
//   expire: number
//   data: any
// }
// class itemDb extends Dexie {
//   item: Dexie.Table<itemRecord, string>

//   constructor(name: string) {
//     super(name)
//     this.version(1).stores({
//       item: '&id, *expire, data'
//     })
//   }
// }


export class Once {
  constructor(name = 'OnceDb') {
    // this.$cache = new Map()
    let db = new Dexie(name)
    db.version(1).stores({
      item: '&id, *expire, data'
    })
    this.db = db
    this.cleanExpire()
    setInterval(() => {
      this.cleanExpire()
    }, 30 * 1000)
  }

  async do(id, fn, cache) {
    if (typeof id !== 'string') {
      return await Promise.reject(ERR_ID)
    }

    try {
      // 不缓存
      if (!cache) {
        return await fn()
      }
      // 查询异步缓存命中
      let value = await this.db.item.where({id}).and(data => data.expire > Date.now()).first()
      if (value) {
        // 更新缓存 ??
        return cloneDeep(value.data)
      }
      // 缓存未命中
      let rsp = await fn()
      let expire
      if (cache === true) {
        expire = Date.now() + 24 * 60 * 60 * 1000
      } else {
        expire = Date.now() + (+cache)
      }
      await this.db.item.add({
        id, expire, data: rsp
      })
      return cloneDeep(rsp)
    } catch(err) {
      console.error(err)
    }
    // let p = this.$cache.get(id)
    // if (p && p.then) {
    //   // cloneDeep 一份, 确保多个请求不会修改同一个对象
    //   try {
    //     let d = await p
    //     return await Promise.resolve(cloneDeep(d))
    //   } catch (err) {
    //     return await Promise.reject(err)
    //   }
    // }
    // p = (async () => {
    //   if (!cache) {
    //     // 不缓存则直接
    //     return await fn()
    //   }
    //   // 查询异步缓存
    //   let value = await this.db.item.where({id}).and(data => data.expire > Date.now()).first()
    //   if (value) {
    //     return value.data
    //   }
    //   // 没有查到缓存
    //   this.$cache.delete(id)

    //   let result = await fn()
    //   // 命中结果, 进缓存
    //   let expire
    //   // 因为前面已经判断过 cache 为假的情况, 所以现在只处理 cache 为真 或 数字时的情况

    //   if (typeof cache === 'boolean') {
    //     // 最长保存一天
    //     expire = Date.now() + 24 * 60 * 60 * 1000
    //   } else {
    //     expire = Date.now() + (+cache)
    //   }
    //   await this.db.item.add({
    //     id, expire, data: result
    //   })

    //   return result
    // })()

    // this.$cache.set(id, p)
    // p.catch(() => {
    //   this.$cache.delete(id)
    // })
    // if (!cache) {
    //   p.then(() => {
    //     this.$cache.delete(id)
    //   }).catch(() => {
    //     this.$cache.delete(id)
    //   })
    // }

    // cloneDeep 一份, 确保多个请求不会修改同一个对象
    // try {
    //   let d = await p
    //   return await Promise.resolve(cloneDeep(d))
    // } catch (err) {
    //   return await Promise.reject(err)
    // }
  }

  async cleanExpire() {
    return await this.db.item.where('expire').belowOrEqual(Date.now()).delete()
  }
}
