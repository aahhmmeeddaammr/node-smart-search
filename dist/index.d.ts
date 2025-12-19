import { SearchOptions, CacheProvider } from "./types";
export declare class SmartSearch {
    private mongo;
    private cache?;
    constructor(mongo: any, cache?: CacheProvider | undefined);
    index(doc: any, collection: string, lang?: "en" | "ar"): Promise<void>;
    search(q: string, options: SearchOptions): Promise<{}>;
}
export * from "./types";
export * from "./cache/redis";
export * from "./storage/mongo";
//# sourceMappingURL=index.d.ts.map