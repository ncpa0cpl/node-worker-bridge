import type { Worker } from "worker_threads";
import * as uuid from "uuid";
import type { AnyFunction, WorkerRequestPayload } from "../types";
import { MessageType } from "../types";
import type { MessagePacker, WorkerInterface } from "..";

/** @internal */
export function getWorkerMethodsProxy<M extends Record<string, AnyFunction>>(
  w: Worker,
  Message: MessagePacker
): WorkerInterface<M> {
  const builtinMethods: WorkerInterface<Record<never, unknown>> = {
    stop: () => w.terminate(),
    _worker_thread_instance: w,
  };

  const methods = new Proxy(builtinMethods, {
    get(target: Record<string, unknown>, propertyName: string) {
      if (propertyName in target) {
        return target[propertyName];
      }

      return (...args: unknown[]) => {
        const payload: WorkerRequestPayload = {
          type: MessageType.REQUEST,
          id: uuid.v4(),
          methodName: propertyName,
          params: args,
        };

        return new Promise((resolve, reject) => {
          w.addListener("message", (ev) => {
            const data = Message.read(ev);

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

          w.postMessage(Message.create(payload));
        });
      };
    },
  });

  return methods as WorkerInterface<M>;
}
