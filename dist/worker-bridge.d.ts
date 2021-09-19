import type { AnyFunction, GetSharedApi, PromisifyDict, WorkerBridgeConfig, WorkerBridgeInterface } from "./types";
export declare function WorkerBridge<E extends Record<string, AnyFunction>, C extends WorkerBridgeConfig>(config: C, workerExport: (sharedApi: PromisifyDict<GetSharedApi<C>>) => E): WorkerBridgeInterface<E>;
