"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
const redis_1 = require("redis");
class RedisCache {
    constructor(url = "redis://localhost:6379") {
        this.client = (0, redis_1.createClient)({ url });
        this.client.on("error", (err) => console.error("Redis Client Error", err));
        this.client.connect();
    }
    async get(key) {
        const val = await this.client.get(key);
        return val ? JSON.parse(val) : null;
    }
    async set(key, value, ttl) {
        if (ttl) {
            await this.client.setEx(key, ttl, JSON.stringify(value));
        }
        else {
            await this.client.set(key, JSON.stringify(value));
        }
    }
}
exports.RedisCache = RedisCache;
//# sourceMappingURL=redis.js.map