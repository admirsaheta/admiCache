import { SetTypes, InitializationOptions, CacheableItem } from "./types/types.js";

interface ExpirationStatitic {
    key: string;
    expireAt: number;
}

interface MostRecentBag<T> {
    key: string | null;
    value?: T;
    ttl?: number;
}

export class AdmiCache<T> {
    private allowedCacheSize: number = Infinity;
    private namespace?: string;
    private store: Map<string, CacheableItem<T>> = new Map();
    private expirationStatistics: ExpirationStatitic[] = [];
    private mostRecentBag: MostRecentBag<T> = { key: null };

    get size(): number {
        return this.store.size;
    }

    constructor(options: InitializationOptions) {
        this.allowedCacheSize = options.size || Infinity;
        this.namespace = options?.namespace;
    }

    set(key: string, value: T, options?: SetTypes): void {
        const normalizedTtl = Number.isInteger(options?.ttl) ? options?.ttl : undefined;
        const valueBag: CacheableItem<T> = { key, value, iat: Date.now(), ttl: normalizedTtl };

        if (this.namespace && !key.startsWith(this.namespace)) {
            throw new Error(`Failed to set value for "${key}" because it's not in ${this.namespace} namespace!`);
        }

        this.delete(key);

        if (valueBag.ttl) {
            const insertBeforePosition = this.expirationStatistics.findIndex(item => item.expireAt > valueBag.iat + (valueBag.ttl as number)) - 1;
            this.expirationStatistics.splice(insertBeforePosition, 0, { key, expireAt: valueBag.iat + valueBag.ttl });
        }

        this.store.set(key, valueBag);
    }


    get(key: string): T | undefined {
        if (this.mostRecentBag.key === key && !this.mostRecentBag.ttl) {
            return this.mostRecentBag.value;
        }

        this.evictItems();

        const valueBag = this.store.get(key);

        if (valueBag) {
            this.store.delete(key);
            this.store.set(key, valueBag);

            this.mostRecentBag = valueBag;

            return valueBag.value;
        }

        return undefined;
    }

    has(key: string): boolean {
        this.evictItems();

        return this.store.has(key);
    }

    peak(key: string): T | undefined {
        this.evictItems();

        return this.store.get(key)?.value;
    }

    delete(key: string): void {
        if (this.store.has(key)) {
            this.store.delete(key);
            // TODO: remove from TTL array
        }

        this.evictItems();
    }

    reset() {
        this.store.clear();
        this.expirationStatistics = [];
    }

    dump(): CacheableItem<T>[] {
        this.evictItems();

        return Array.from(this.store, ([, value]) => value);
    }

    load(data: CacheableItem<T>[]) {
        if (this.store.size !== 0) {
            throw new Error("Cannot load data into cache, because it's not empty!");
        }

        data.every((item, index) => {
            this.set(item.key, item.value, { ttl: item.ttl });

            return index < this.allowedCacheSize;
        });
    }

    private evictItems() {
        let expirationExitIndex = 0;

        if (this.expirationStatistics.length) {
            this.expirationStatistics.every((item, index) => {
                expirationExitIndex = index;
                if (item.expireAt < Date.now()) {
                    this.store.delete(item.key);

                    return true;
                }

                return false;
            });

            if (expirationExitIndex - 1 > 0) {
                this.expirationStatistics.splice(0, expirationExitIndex - 1);
            }
        }

        if (this.store.size > this.allowedCacheSize) {
            const iterator = this.store.entries();
            let iteratorResult: IteratorResult<[string, CacheableItem<T>], any> = iterator.next();

            while (!iteratorResult.done && this.store.size > this.allowedCacheSize) {
                this.store.delete(iteratorResult.value[0]);

                iteratorResult = iterator.next();
            }
        }
    }
}