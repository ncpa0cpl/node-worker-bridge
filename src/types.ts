import type { Worker } from "worker_threads";

export type AssertPromise<V> = V extends Promise<any> ? V : Promise<V>;

export type Promisify<F extends AnyFunction> = F extends (
  ...args: infer A
) => infer R
  ? (...args: A) => AssertPromise<R>
  : never;

export type PromisifyDict<D extends Record<string, AnyFunction>> = {
  [K in keyof D]: Promisify<D[K]>;
};

export type AnyFunction = (...args: any[]) => any;

export type WorkerBridgeConfig = {
  file: string | (() => Worker);
  sharedApi?: Record<string, AnyFunction>;
};

export type GetSharedApi<C extends WorkerBridgeConfig> =
  C["sharedApi"] extends object ? C["sharedApi"] : Record<never, AnyFunction>;

export type WorkerBridgeInterface<T extends Record<string, AnyFunction>> = {
  spawn(): PromisifyDict<T>;
};

export enum MessageType {
  RESPONSE = "RESPONSE",
  REQUEST = "REQUEST",
}

export type WorkerRequestPayload = {
  type: MessageType.REQUEST;
  id: string;
  methodName: string;
  params: unknown[];
};

export type WorkerResponsePayload = {
  type: MessageType.RESPONSE;
  id: string;
  error?: string;
  result: unknown;
};

export type WorkerMessage = WorkerRequestPayload | WorkerResponsePayload;
