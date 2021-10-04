import * as uuid from "uuid";
import type { Worker } from "worker_threads";
import { createSubscriptionManager } from "../SubscriptionManager";
import type {
  AnyFunction,
  MessagePacker,
  WorkerInterface,
  WorkerMessage,
  WorkerRequestPayload,
} from "../types";
import { MessageType } from "../types";

/** @internal */
export function getWorkerMethodsProxy<M extends Record<string, AnyFunction>>(
  w: Worker,
  Message: MessagePacker
): WorkerInterface<M> {
  const messageManager = createSubscriptionManager<[WorkerMessage]>();

  w.addListener("message", (ev) => {
    const data = Message.read(ev);
    messageManager.notify(data);
  });

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
          const sub = messageManager.subscribe((message) => {
            if (message.type === MessageType.RESPONSE) {
              if (message.id === payload.id) {
                sub.remove();
                if (message.error) {
                  reject(new Error(message.error));
                } else {
                  resolve(message.result);
                }
              }
            }
          });

          w.postMessage(Message.create(payload));
        });
      };
    },
  });

  return methods as WorkerInterface<M>;
}
