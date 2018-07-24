import Dexie from 'dexie'
import { cloneDeep } from 'lodash'
export const ERR_ID = 'id should be string'
export const ERR_DATA_EXPIRED = 'data expired'
export const REPEATING_REQUEST = 'repeating request'

// interface item {
//   id: string
//   expire: number
//   data: any
// }

export class Once {
    constructor(name = 'OnceDb') {
        let db = new Dexie(name)
        db.version(1).stores({
            item: '&id, *expire, data'
        })
        this.db = db
        this.cleanExpire()
    }

    async do(id, fn, cache) {
        try {
            if (typeof id !== 'string') {
                return Promise.reject(ERR_ID)
            }
            // 不缓存
            if (!cache) {
                return await fn()
            }
            // 清除过期缓存
            this.cleanExpire()
            // 查询缓存
            let value = await this.db.item.where({ id }).and(data => data.expire > Date.now()).first()
            if (value) {
                // 缓存命中
                return Promise.resolve(cloneDeep(value.data))
            } else {
                // 缓存未命中
                let rsp = await fn()
                let expire
                if (cache === true) {
                    expire = Date.now() + 24 * 60 * 60 * 1000
                } else {
                    expire = Date.now() + (+cache)
                }
                await this.db.item.add({
                    id,
                    expire,
                    data: rsp
                })
                return Promise.resolve(cloneDeep(rsp))
            }
        } catch (e) {
            return Promise.reject(e)
        }

    }

    async cleanExpire() {
        await this.db.item.where('expire').belowOrEqual(Date.now()).delete()
    }
}