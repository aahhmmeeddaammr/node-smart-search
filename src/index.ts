import { indexDocument } from "./engine/indexer";
import { search } from "./engine/searcher";
import { SearchOptions, CacheProvider } from "./types";

export class SmartSearch {
  constructor(private mongo: any, private cache?: CacheProvider) {}

  index(doc: any, collection: string, lang: "en" | "ar" = "en") {
    return indexDocument(doc, collection, this.mongo, lang);
  }

  search(q: string, options: SearchOptions) {
    return search(q, options, this.mongo, this.cache);
  }
}

export * from "./types";
export * from "./cache/redis";
export * from "./storage/mongo";

