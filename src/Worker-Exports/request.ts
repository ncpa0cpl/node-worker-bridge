import type { Worker } from "worker_threads";
import * as uuid from "uuid";
import type {
  AnyFunction,
  PromisifyDict,
  WorkerMessage,
  WorkerRequestPayload,
} from "../types";
import { MessageType } from "../types";

/** @internal */
export function getWorkerMethodsProxy<M extends Record<string, AnyFunction>>(
  w: Worker
) {
  const methods = new Proxy(
    {},
    {
      get(_, methodName: string) {
        return (...args: unknown[]) => {
          const payload: WorkerRequestPayload = {
            type: MessageType.REQUEST,
            id: uuid.v4(),
            methodName,
            params: args,
          };

          return new Promise((resolve, reject) => {
            w.addListener("message", (ev) => {
              const data = JSON.parse(ev) as WorkerMessage;

              if (data.type === MessageType.RESPONSE) {
                if (data.id === payload.id) {
                  if (data.error) {
                    reject(new Error(data.error));
                  } else {
                    resolve(data.result);
                  }
                }
              }
            });

            w.addListener("error", (e) => {
              reject(e);
            });

            w.addListener("messageerror", (e) => {
              reject(e);
            });

            w.postMessage(JSON.stringify(payload));
          });
        };
      },
    }
  );

  return methods as PromisifyDict<M>;
}
