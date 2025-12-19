import { CacheProvider } from "../types";
export declare class RedisCache implements CacheProvider {
    private client;
    constructor(url?: string);
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
}
//# sourceMappingURL=redis.d.ts.map