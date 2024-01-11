export type InitializationOptions = {
    size: number;
    namespace?: string;
}

export type SetTypes = {
    ttl?: number;
}

export type CacheableItem<T> = {
    key: string;
    ttl: number | undefined;
    iat: number;
    value: T;
}