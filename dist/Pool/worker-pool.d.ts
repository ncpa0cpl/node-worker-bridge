import type { AnyFunction, WorkerBridgeInterface, WorkerPool } from "../types";
export declare function createPool<T extends Record<string, AnyFunction>>(bridge: Pick<WorkerBridgeInterface<T, any>, "spawn">, poolSize: number): WorkerPool<T>;
