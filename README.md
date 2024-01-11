# admiCahce: simple key-value in memory library for nodeJS

Key Features:

- Lightning-fast, feather-light, and dependency-free
- Proactive key eviction policy for optimal performance
- Always up-to-date TypeScript typings for seamless integration
- Modern design, coded in ES2020 (Node LTS 14+)
- Utilizes native ES modules (docs available)
- Convenient helper function for estimating cache size in memory

  
## Installation:


```npm i @praella/admicache"```

Usage:
```ts
import { AdmiCache } from 'dscache';

const myCache = new AdmiCache({ size: 1000 });

myCache.set('user-token:231', userTokenObject, { ttl: 30_000 });
myCache.get('user-token:231');
// -> returns userTokenObject
```
