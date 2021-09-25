import type { AnyFunction, WorkerBridgeInterface, WorkerPool } from "../types";
export declare function createPool<T extends Record<string, AnyFunction>>(bridge: Pick<WorkerBridgeInterface<T>, "spawn">, poolSize: number): WorkerPool<T>;
