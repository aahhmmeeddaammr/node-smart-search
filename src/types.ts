export interface SearchOptions {
  collection: string;
  language?: "en" | "ar";
  fields?: string[];
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
}

