import { createClient } from "redis";
import { CacheProvider } from "../types";

export class RedisCache implements CacheProvider {
  private client: any;

  constructor(url: string = "redis://localhost:6379") {
    this.client = createClient({ url });
    this.client.on("error", (err: any) => console.error("Redis Client Error", err));
    this.client.connect();
  }

  async get<T>(key: string): Promise<T | null> {
    const val = await this.client.get(key);
    return val ? JSON.parse(val) : null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } else {
      await this.client.set(key, JSON.stringify(value));
    }
  }
}

