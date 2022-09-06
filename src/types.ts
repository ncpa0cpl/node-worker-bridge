import type { Worker } from "worker_threads";

export type AssertPromise<V> = V extends Promise<any> ? V : Promise<V>;

export type Promisify<F extends AnyFunction> = F extends (
  ...args: infer A
) => infer R
  ? (...args: A) => AssertPromise<R>
  : never;

export type Depromisify<F extends AnyFunction> = F extends (
  ...args: infer A
) => Promise<infer R>
  ? (...args: A) => R | Promise<R>
  : F;

export type PromisifyDict<D extends Record<string, AnyFunction>> = {
  [K in keyof D]: Promisify<D[K]>;
};

export type DepromisifyDict<D extends Record<string, AnyFunction>> = {
  [K in keyof D]: Depromisify<D[K]>;
};

export type AnyFunction = (...args: any[]) => any;

export type WorkerBridgeConfig = {
  file: string | (() => Worker);
  parseMessagesWithJSON?: boolean;
};

// export type GetSharedApi<C extends WorkerBridgeConfig> =
//   C["sharedApi"] extends object ? C["sharedApi"] : Record<never, AnyFunction>;

export type WorkerInterface<T extends Record<string, AnyFunction>> =
  PromisifyDict<T> & {
    stop(): Promise<number>;
    _worker_thread_instance: Worker;
  };

export type WorkerBridgeInterface<
  T extends Record<string, AnyFunction>,
  C extends Record<string, AnyFunction>
> = [keyof C] extends [never]
  ? {
      spawn(): WorkerInterface<T>;
      createPool(poolSize: number): WorkerPool<T>;
    }
  : {
      spawn(api: DepromisifyDict<C>): WorkerInterface<T>;
      createPool(poolSize: number, api: DepromisifyDict<C>): WorkerPool<T>;
    };

/**
 * @internal
 */
export enum MessageType {
  RESPONSE = "RESPONSE",
  REQUEST = "REQUEST",
}

/**
 * @internal
 */
export type WorkerRequestPayload = {
  type: MessageType.REQUEST;
  id: string;
  methodName: string;
  params: unknown[];
};

/**
 * @internal
 */
export type WorkerResponsePayload = {
  type: MessageType.RESPONSE;
  id: string;
  error?: string;
  result: unknown;
};

/**
 * @internal
 */
export type WorkerMessage = WorkerRequestPayload | WorkerResponsePayload;

/**
 * @internal
 */
export type MessagePacker = {
  read(v: any): WorkerMessage;
  create(v: WorkerMessage): any;
};

export type WorkerPool<T extends Record<string, AnyFunction>> =
  PromisifyDict<T> & {
    close(): void;
  };

export type PoolWorkerThread<T extends Record<string, AnyFunction>> = {
  instance: WorkerInterface<T>;
  currentJob: Promise<unknown> | undefined;
};
