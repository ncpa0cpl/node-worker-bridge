export declare const testPromise: <T>() => {
    wait: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
};
export declare function sleep(ms: number): Promise<void>;
