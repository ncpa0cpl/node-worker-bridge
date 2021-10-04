/// <reference types="node" />
import type { Worker } from "worker_threads";
export declare type AssertPromise<V> = V extends Promise<any> ? V : Promise<V>;
export declare type Promisify<F extends AnyFunction> = F extends (...args: infer A) => infer R ? (...args: A) => AssertPromise<R> : never;
export declare type PromisifyDict<D extends Record<string, AnyFunction>> = {
    [K in keyof D]: Promisify<D[K]>;
};
export declare type AnyFunction = (...args: any[]) => any;
export declare type WorkerBridgeConfig = {
    file: string | (() => Worker);
    sharedApi?: Record<string, AnyFunction>;
    parseMessagesWithJSON?: boolean;
};
export declare type GetSharedApi<C extends WorkerBridgeConfig> = C["sharedApi"] extends object ? C["sharedApi"] : Record<never, AnyFunction>;
export declare type WorkerInterface<T extends Record<string, AnyFunction>> = PromisifyDict<T> & {
    stop(): Promise<number>;
    _worker_thread_instance: Worker;
};
export declare type WorkerBridgeInterface<T extends Record<string, AnyFunction>, C extends Record<string, AnyFunction>> = {
    spawn(api?: Partial<C>): WorkerInterface<T>;
    createPool(poolSize: number, api?: Partial<C>): WorkerPool<T>;
};
export declare type WorkerPool<T extends Record<string, AnyFunction>> = PromisifyDict<T> & {
    close(): void;
};
export declare type PoolWorkerThread<T extends Record<string, AnyFunction>> = {
    instance: WorkerInterface<T>;
    currentJob: Promise<unknown> | undefined;
};
