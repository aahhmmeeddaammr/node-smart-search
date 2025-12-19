# Search Engine

A multi-language search engine built with TypeScript, featuring MongoDB storage and Redis caching support.

## Features

- **Multi-language Support**: Currently supports English and Arabic with extensible language processors
- **MongoDB Storage**: Persistent document storage with MongoDB
- **Redis Caching**: Optional Redis caching for improved search performance
- **Advanced Scoring**: TF-IDF based scoring with phrase matching and proximity boosting
- **Phrase Matching**: Support for exact phrase searches using quoted strings
- **Field Filtering**: Search within specific document fields using `s__*` prefixed fields
- **Pagination**: Built-in support for result pagination
- **Express API Server**: Ready-to-use REST API with automatic indexing
- **Auto-indexing**: Automatically indexes existing documents on server startup

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Quick Start

### Setup

1. Make sure MongoDB and Redis are running
2. Build the package: `npm run build` (from root directory)
3. Install dependencies: `npm install`
4. Set environment variables (optional):
   - `MONGODB_URI` (default: `mongodb://localhost:27017`)
   - `DB_NAME` (default: `test_db`)
   - `REDIS_URL` (default: `redis://localhost:6379`)
   - `PORT` (default: `3000`)

### Simple Example

```javascript
const { SmartSearch, MongoIndex, RedisCache } = require("node-smart-search");
const { MongoClient } = require("mongodb");

// Connect to MongoDB
const client = new MongoClient("mongodb://localhost:27017");
await client.connect();
const db = client.db("test_db");
const indexCollection = db.collection("search_index");
const mongoIndex = new MongoIndex(indexCollection);

// Optional: Redis cache
const redisCache = new RedisCache("redis://localhost:6379");

// Create engine
const engine = new SmartSearch(mongoIndex, redisCache);

// Index any document with s__* fields
await engine.index({
  _id: "prod_1",
  name: "iPhone 16",
  s__title: "iPhone 16 Pro Max",
  s__description: "Latest iPhone with advanced features"
}, "products", "en");

// Search
const results = await engine.search("iphone 16", {
  collection: "products"
});
```

### API Server

Start the Express server:

```bash
node server.js
```

The server will automatically index all existing products from the `products` collection on startup.

#### Endpoints

**Search Products**
```bash
GET /search?q=<query>&collection=<collection_name>

# Example
curl "http://localhost:3000/search?q=iPhone&collection=products"
```

Response:
```json
{
  "query": "iPhone",
  "collection": "products",
  "total": 2,
  "results": [
    {
      "_id": "...",
      "name": "iPhone 16",
      "s__title": "iPhone 16 Pro Max",
      "s__description": "Latest iPhone with advanced features"
    }
  ]
}
```

**Index Single Document**
```bash
POST /index
Content-Type: application/json

{
  "doc": {
    "_id": "prod_1",
    "name": "iPhone 16",
    "s__title": "iPhone 16 Pro Max",
    "s__description": "Latest iPhone with advanced features"
  },
  "collection": "products",
  "lang": "en"
}
```

**Bulk Index All Products**
```bash
POST /index/bulk
Content-Type: application/json

{
  "collection": "products",
  "lang": "en"
}
```

### Run Examples

```bash
# Seed sample data
node seed.js

# Run example
node example-usage.js

# Start API server
node server.js
```

## Usage

### Basic Usage

```typescript
import { SmartSearch } from './src/index';
import { MongoIndex } from './src/storage/mongo';
import { RedisCache } from './src/cache/redis';
import { MongoClient } from 'mongodb';

// Connect to MongoDB
const client = new MongoClient('mongodb://localhost:27017');
await client.connect();
const db = client.db('test_db');
const indexCollection = db.collection('search_index');
const mongoIndex = new MongoIndex(indexCollection);

// Optional: Redis cache
const redisCache = new RedisCache('redis://localhost:6379');

// Create engine
const engine = new SmartSearch(mongoIndex, redisCache);

// Index documents
await engine.index({
  _id: '1',
  s__title: 'Search Engine Document',
  s__content: 'This is a sample document about search engines.',
  s__category: 'technology'
}, 'documents', 'en');

// Search
const results = await engine.search('search engine', {
  collection: 'documents'
});
```

### Searchable Fields

Prefix fields with `s__` to make them searchable:

```javascript
{
  _id: "prod_1",
  name: "iPhone 16",              // Not searchable
  price: 999,                      // Not searchable
  s__title: "iPhone 16 Pro Max",   // Searchable
  s__description: "Latest iPhone", // Searchable
  s__brand: "Apple"                // Searchable
}
```

## Language Support

### English
- Tokenization
- Stop word filtering
- Stemming (simplified Porter-like)
- Normalization

### Arabic
- Arabic-specific tokenization
- Diacritic removal
- Arabic stop word filtering
- Arabic stemming

## Configuration

### MongoDB
Set the MongoDB connection URI via environment variable or in code:
```typescript
const mongoIndex = new MongoIndex(indexCollection);
```

### Redis (Optional)
Provide Redis URL for caching:
```typescript
const redisCache = new RedisCache('redis://localhost:6379');
```

## API

### SmartSearch

- `index(document, collection, lang)`: Index a single document
- `search(query, options)`: Perform a search query
- `remove(id, collection)`: Remove a document from the index

### Search Options

```typescript
interface SearchOptions {
  collection: string;      // Collection to search in
  fields?: string[];       // Specific fields to search (optional)
  limit?: number;          // Maximum results (default: 10)
  offset?: number;         // Pagination offset (default: 0)
}
```

### Document Structure

Documents should include searchable fields prefixed with `s__`:

```typescript
interface Document {
  _id: string | ObjectId;  // Unique identifier
  [key: string]: any;      // Any other fields
  s__*?: string;           // Searchable fields (prefixed with s__)
}
```

## Server Features

- ✅ Automatic indexing of existing products on server startup
- 🔍 Full-text search with relevance ranking
- 📦 Returns complete product details in search results
- 🚀 Redis caching for improved performance
- 🎯 Maintains search result ordering
- 🔄 Bulk indexing support
- 🌐 RESTful API with Express

## License

MIT