# 🔍 node-smart-search

A powerful, flexible full-text search engine for Node.js with MongoDB storage and Redis caching. 

[![npm version](https://img.shields.io/npm/v/node-smart-search.svg)](https://www.npmjs.com/package/node-smart-search)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🌍 **Multi-language Support** - English and Arabic with smart tokenization
- 🔤 **Fuzzy Matching** - Typo tolerance with Levenshtein distance
- 📝 **Synonym Expansion** - Search "buy" finds "purchase", "acquire", etc.
- 🔠 **Abbreviation Support** - Search "AI" finds "artificial intelligence"
- 🎯 **Prefix Search** - Search with 1-2 characters
- 🔄 **Fallback Strategies** - Auto-fallback to regex/includes matching
- 📊 **TF-IDF Scoring** - Relevance-based ranking
- 🚀 **Redis Caching** - Optional caching for improved performance
- 🍃 **MongoDB & Mongoose** - Works with both native driver and Mongoose

---

## 📦 Installation

```bash
npm install node-smart-search
```

---

## 🚀 Quick Start

### With Mongoose (Recommended)

```javascript
const mongoose = require('mongoose');
const { SmartSearch, MongoIndex } = require('node-smart-search');

// 1. Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/myapp');

// 2. Create a Mongoose model for the search index
const searchIndexSchema = new mongoose.Schema({
  term: { type: String, required: true, index: true },
  docId: { type: mongoose.Schema.Types.Mixed, required: true },
  field: { type: String, required: true },
  collection: { type: String, required: true, index: true },
  tf: { type: Number, default: 1 },
  positions: [Number]
});

// Compound indexes for optimal performance
searchIndexSchema.index({ term: 1, collection: 1 });
searchIndexSchema.index({ docId: 1, collection: 1, field: 1 });
searchIndexSchema.index({ term: 1, docId: 1, field: 1, collection: 1 }, { unique: true });

const SearchIndex = mongoose.model('SearchIndex', searchIndexSchema);

// 3. Create the search engine
const mongoIndex = new MongoIndex(SearchIndex);
const engine = new SmartSearch(mongoIndex);

// 4. Index documents (fields starting with s__ are searchable)
await engine.index({
  _id: 'prod_1',
  name: 'iPhone 16',           // NOT searchable
  price: 999,                  // NOT searchable
  s__title: 'iPhone 16 Pro Max',        // ✅ Searchable
  s__description: 'Latest Apple smartphone with AI features',  // ✅ Searchable
  s__brand: 'Apple'            // ✅ Searchable
}, 'products', 'en');

// 5. Search!
const productIds = await engine.search('iphone', { collection: 'products' });
console.log(productIds); // ['prod_1']

// 6. Fetch full documents
const products = await Product.find({ _id: { $in: productIds } });
```

### With Native MongoDB Driver

```javascript
const { MongoClient } = require('mongodb');
const { SmartSearch, MongoIndex } = require('node-smart-search');

// 1. Connect to MongoDB
const client = new MongoClient('mongodb://localhost:27017');
await client.connect();
const db = client.db('myapp');

// 2. Create an index collection
const indexCollection = db.collection('search_index');

// 3. Create recommended indexes
await indexCollection.createIndex({ term: 1, collection: 1 });
await indexCollection.createIndex({ docId: 1, collection: 1, field: 1 });
await indexCollection.createIndex(
  { term: 1, docId: 1, field: 1, collection: 1 }, 
  { unique: true }
);

// 4. Create the search engine
const mongoIndex = new MongoIndex(indexCollection);
const engine = new SmartSearch(mongoIndex);

// 5. Index and search (same as above)
await engine.index({
  _id: 'prod_1',
  s__title: 'iPhone 16 Pro Max',
  s__description: 'Latest Apple smartphone'
}, 'products', 'en');

const results = await engine.search('iphone', { collection: 'products' });
```

---

## 🔧 Configuration

### Search Options

```typescript
const results = await engine.search('query', {
  // Required
  collection: 'products',
  
  // Optional - Language & Tokenization
  language: 'en',              // 'en' or 'ar' (default: 'en')
  minTermLength: 1,            // Minimum token length (default: 1)
  
  // Optional - Search Strategies
  enableFuzzy: true,           // Enable fuzzy matching (default: true)
  fuzzyThreshold: 2,           // Max edit distance (default: 2)
  fallbackToIncludes: true,    // Fallback to regex (default: true)
  enablePrefixMatch: true,     // Enable prefix search (default: true)
  
  // Optional - Pagination
  limit: 10,                   // Max results
  offset: 0                    // Skip results
});
```

---

## 🔍 Search Features

### 1. Short Query Search (1-2 characters)

```javascript
// Search with just 2 characters - automatically uses prefix matching
const results = await engine.search('AI', { collection: 'products' });
// Finds: "AI-powered device", "Artificial Intelligence"

const results = await engine.search('ip', { collection: 'products' });
// Finds: "iPhone", "iPad", "IP Camera"
```

### 2. Fuzzy Matching (Typo Tolerance)

```javascript
// Typos are automatically corrected
const results = await engine.search('iphon', { 
  collection: 'products',
  enableFuzzy: true,
  fuzzyThreshold: 2  // Allow up to 2 character differences
});
// Finds: "iPhone" despite the missing 'e'
```

### 3. Fallback to Substring/Includes

```javascript
// If exact match fails, searches using substring matching
const results = await engine.search('gaming', { 
  collection: 'products',
  fallbackToIncludes: true 
});
// Finds products where any indexed term CONTAINS 'gaming'
```

### 4. Synonym Expansion

```javascript
// Automatically expands to synonyms
const results = await engine.search('buy', { collection: 'products' });
// Also searches for: 'purchase', 'acquire', 'order'

const results = await engine.search('fast', { collection: 'products' });
// Also searches for: 'quick', 'rapid', 'swift', 'speedy'
```

### 5. Abbreviation Expansion

```javascript
// Common abbreviations are expanded
const results = await engine.search('AI', { collection: 'products' });
// Also searches for: 'artificial intelligence'

const results = await engine.search('dev', { collection: 'products' });
// Also searches for: 'developer', 'development'
```

### 6. Autocomplete / Suggestions

```javascript
const suggestions = await engine.getSuggestions('iph', { 
  collection: 'products' 
}, 5);
// Returns: ['iphone', 'iphoto', ...]
```

---

## 🗄️ Mongoose Integration - Complete Example

Here's a complete example for a real-world e-commerce application:

```javascript
const mongoose = require('mongoose');
const { SmartSearch, MongoIndex, RedisCache } = require('node-smart-search');

// ============ MODELS ============

// Product Model
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  brand: String,
  description: String,
  // Searchable fields (auto-indexed)
  s__title: String,
  s__description: String,
  s__brand: String,
  s__category: String,
  s__tags: String
});

const Product = mongoose.model('Product', productSchema);

// Search Index Model
const searchIndexSchema = new mongoose.Schema({
  term: { type: String, required: true },
  docId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  field: String,
  collection: String,
  tf: Number,
  positions: [Number]
});

searchIndexSchema.index({ term: 1, collection: 1 });
searchIndexSchema.index({ term: 1, docId: 1, field: 1, collection: 1 }, { unique: true });

const SearchIndex = mongoose.model('SearchIndex', searchIndexSchema);

// ============ SEARCH ENGINE SETUP ============

async function setupSearch() {
  await mongoose.connect('mongodb://localhost:27017/ecommerce');
  
  const mongoIndex = new MongoIndex(SearchIndex);
  
  // Optional: Add Redis caching
  // const cache = new RedisCache('redis://localhost:6379');
  // const engine = new SmartSearch(mongoIndex, cache);
  
  const engine = new SmartSearch(mongoIndex);
  
  return engine;
}

// ============ INDEXING ============

async function indexProduct(engine, product) {
  // Prepare searchable fields
  const searchDoc = {
    _id: product._id,
    s__title: product.name,
    s__description: product.description,
    s__brand: product.brand,
    s__category: product.category,
    s__tags: product.tags?.join(' ') || ''
  };
  
  await engine.index(searchDoc, 'products', 'en');
}

// Index all products on startup
async function indexAllProducts(engine) {
  const products = await Product.find();
  
  for (const product of products) {
    await indexProduct(engine, product);
  }
  
  console.log(`Indexed ${products.length} products`);
}

// ============ SEARCHING ============

async function searchProducts(engine, query, options = {}) {
  // Get matching document IDs
  const productIds = await engine.search(query, {
    collection: 'products',
    language: 'en',
    enableFuzzy: true,
    fallbackToIncludes: true,
    limit: options.limit || 20,
    offset: options.offset || 0
  });
  
  if (productIds.length === 0) {
    return [];
  }
  
  // Fetch full product documents while maintaining order
  const products = await Product.find({ 
    _id: { $in: productIds } 
  });
  
  // Sort by search result order (relevance)
  const productMap = new Map(products.map(p => [p._id.toString(), p]));
  return productIds
    .map(id => productMap.get(id.toString()))
    .filter(Boolean);
}

// ============ USAGE ============

async function main() {
  const engine = await setupSearch();
  
  // Create a product
  const product = await Product.create({
    name: 'iPhone 16 Pro Max',
    price: 1199,
    brand: 'Apple',
    category: 'Smartphones',
    description: 'Latest AI-powered smartphone with advanced camera'
  });
  
  // Index it
  await indexProduct(engine, {
    ...product.toObject(),
    s__title: product.name,
    s__description: product.description,
    s__brand: product.brand,
    s__category: product.category
  });
  
  // Search examples
  console.log(await searchProducts(engine, 'iphone'));      // ✅ Exact match
  console.log(await searchProducts(engine, 'iphon'));       // ✅ Fuzzy match
  console.log(await searchProducts(engine, 'AI'));          // ✅ Short query
  console.log(await searchProducts(engine, 'smartphone'));  // ✅ Synonym match
}

main().catch(console.error);
```

---

## 📄 API Reference

### SmartSearch

| Method | Description |
|--------|-------------|
| `index(doc, collection, lang)` | Index a document for searching |
| `search(query, options)` | Search for documents |
| `getSuggestions(query, options, limit)` | Get autocomplete suggestions |
| `analyzeQuery(query, language)` | Debug how a query is processed |

### SearchOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `collection` | string | *required* | Collection name |
| `language` | 'en' \| 'ar' | 'en' | Language for tokenization |
| `minTermLength` | number | 1 | Minimum token length |
| `enableFuzzy` | boolean | true | Enable fuzzy matching |
| `fuzzyThreshold` | number | 2 | Max Levenshtein distance |
| `fallbackToIncludes` | boolean | true | Fallback to regex matching |
| `enablePrefixMatch` | boolean | true | Enable prefix search |
| `limit` | number | - | Max results to return |
| `offset` | number | - | Skip N results |

### Document Structure

```javascript
{
  _id: 'unique_id',           // Required - Document ID
  s__title: 'Searchable',     // Indexed - prefix with s__
  s__description: 'Text',     // Indexed - prefix with s__
  regularField: 'value'       // NOT indexed
}
```

---

## 🛠️ Utilities

```javascript
const { 
  tokenizeEn, 
  tokenizeAr, 
  normalizeEnWord, 
  editDistance,
  isFuzzyMatch 
} = require('node-smart-search');

// Tokenize English text
tokenizeEn('Running fast!');  // ['run', 'fast']

// Tokenize Arabic text
tokenizeAr('البحث الذكي');    // ['بحث', 'ذكي']

// Normalize a word
normalizeEnWord('gaming');    // 'game'
normalizeEnWord('purchased'); // 'purchas'

// Check similarity
editDistance('iphone', 'iphon');     // 1
isFuzzyMatch('iphone', 'iphon', 2);  // true
```

---

## 🌐 Redis Caching

```javascript
const { SmartSearch, MongoIndex, RedisCache } = require('node-smart-search');

const mongoIndex = new MongoIndex(SearchIndexModel);
const cache = new RedisCache('redis://localhost:6379');
const engine = new SmartSearch(mongoIndex, cache);

// Search results are now cached for 5 minutes
const results = await engine.search('query', { collection: 'products' });
```

---

## 📁 Project Structure

```
src/
├── index.ts           # Main entry point
├── types.ts           # TypeScript interfaces
├── engine/
│   ├── indexer.ts     # Document indexing
│   ├── searcher.ts    # Search logic with fuzzy/prefix/fallback
│   └── phrase.ts      # Phrase matching
├── language/
│   ├── english.ts     # English tokenization & stemming
│   └── arabic.ts      # Arabic tokenization & normalization
├── storage/
│   └── mongo.ts       # MongoDB/Mongoose storage adapter
├── cache/
│   └── redis.ts       # Redis cache adapter
└── utils/
    ├── fields.ts      # Field extraction
    └── normalize.ts   # Text normalization
```

---

## 🧪 Version History

### v2.0.1 (Latest)
- ✅ Added support for 1-2 character searches
- ✅ Activated fuzzy matching with Levenshtein distance
- ✅ Added fallback to regex/includes matching
- ✅ Prefix search for short queries
- ✅ Full Mongoose model support
- ✅ Enhanced Arabic language support
- ✅ Improved stemming and normalization

### v1.0.0
- Initial release with basic search functionality

---

## 📄 License

MIT © 2024

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.