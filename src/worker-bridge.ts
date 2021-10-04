import { isMainThread, Worker } from "worker_threads";
import type { WorkerPool } from ".";
import { getMessagePacker } from "./Message/message";
import { createPool as cp } from "./Pool/worker-pool";
import { getSharedApi } from "./SharedApi/request";
import { redirectSharedApiCalls } from "./SharedApi/response";
import type {
  AnyFunction,
  GetSharedApi,
  PromisifyDict,
  WorkerBridgeConfig,
  WorkerBridgeInterface,
} from "./types";
import { getWorkerMethodsProxy } from "./WorkerExports/request";
import { redirectWorkerMethods } from "./WorkerExports/response";

export function WorkerBridge<
  E extends Record<string, AnyFunction>,
  C extends WorkerBridgeConfig
>(
  config: C,
  workerExport: (sharedApi: PromisifyDict<GetSharedApi<C>>) => E
): WorkerBridgeInterface<E, GetSharedApi<C>> {
  const { sharedApi = {} } = config;

  const Message = getMessagePacker(config);

  if (isMainThread) {
    const spawn = (api: Partial<GetSharedApi<C>> = {}) => {
      const worker =
        typeof config.file === "string"
          ? new Worker(config.file)
          : config.file();

      worker.unref();

      redirectSharedApiCalls(worker, { ...sharedApi, ...api }, Message);

      return getWorkerMethodsProxy<E>(worker, Message);
    };

    const createPool = (
      poolSize: number,
      api?: Partial<GetSharedApi<C>>
    ): WorkerPool<E> => {
      return cp({ spawn: () => spawn(api) }, poolSize);
    };

    return {
      spawn,
      createPool,
    };
  }

  const api = getSharedApi<GetSharedApi<C>>(Message);

  const exportedMethods = workerExport(api);

  redirectWorkerMethods(exportedMethods, Message);

  return {
    spawn() {
      throw new Error(
        "Worker Bridge Interface can only be used within the main thread."
      );
    },
    createPool() {
      throw new Error(
        "Worker Bridge Interface can only be used within the main thread."
      );
    },
  };
}
