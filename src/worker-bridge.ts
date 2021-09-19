import { isMainThread, Worker } from "worker_threads";
import { getMessagePacker } from "./Message/message";
import { getSharedApi } from "./Shared-Api/request";
import { redirectSharedApiCalls } from "./Shared-Api/response";
import type {
  AnyFunction,
  GetSharedApi,
  PromisifyDict,
  WorkerBridgeConfig,
  WorkerBridgeInterface,
} from "./types";
import { getWorkerMethodsProxy } from "./Worker-Exports/request";
import { redirectWorkerMethods } from "./Worker-Exports/response";

export function WorkerBridge<
  E extends Record<string, AnyFunction>,
  C extends WorkerBridgeConfig
>(
  config: C,
  workerExport: (sharedApi: PromisifyDict<GetSharedApi<C>>) => E
): WorkerBridgeInterface<E> {
  const Message = getMessagePacker(config);

  if (isMainThread) {
    return {
      spawn() {
        const worker =
          typeof config.file === "string"
            ? new Worker(config.file)
            : config.file();

        redirectSharedApiCalls(worker, config, Message);

        return getWorkerMethodsProxy<E>(worker, Message);
      },
    };
  }

  const sharedApi = getSharedApi<GetSharedApi<C>>(Message);

  const exportedMethods = workerExport(sharedApi);

  redirectWorkerMethods(exportedMethods, Message);

  return {
    spawn() {
      throw new Error(
        "Worker Bridge Interface can only be used within the main thread."
      );
    },
  };
}
