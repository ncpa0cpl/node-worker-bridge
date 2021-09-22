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
export declare type WorkerBridgeInterface<T extends Record<string, AnyFunction>> = {
    spawn(): WorkerInterface<T>;
};
export declare enum MessageType {
    RESPONSE = "RESPONSE",
    REQUEST = "REQUEST"
}
export declare type WorkerRequestPayload = {
    type: MessageType.REQUEST;
    id: string;
    methodName: string;
    params: unknown[];
};
export declare type WorkerResponsePayload = {
    type: MessageType.RESPONSE;
    id: string;
    error?: string;
    result: unknown;
};
export declare type WorkerMessage = WorkerRequestPayload | WorkerResponsePayload;
export declare type MessagePacker = {
    read(v: any): WorkerMessage;
    create(v: WorkerMessage): any;
};
