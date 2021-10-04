import * as uuid from "uuid";
import { parentPort } from "worker_threads";
import { createSubscriptionManager } from "../SubscriptionManager";
import type {
  AnyFunction,
  MessagePacker,
  PromisifyDict,
  WorkerMessage,
  WorkerRequestPayload,
} from "../types";
import { MessageType } from "../types";

/** @internal */
export function getSharedApi<M extends Record<string, AnyFunction>>(
  Message: MessagePacker
) {
  const messageManager = createSubscriptionManager<[WorkerMessage]>();

  parentPort!.addListener("message", (data) => {
    const message = Message.read(data);
    messageManager.notify(message);
  });

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
            const sub = messageManager.subscribe((message) => {
              if (message.type === MessageType.RESPONSE) {
                if (payload.id === message.id) {
                  sub.remove();
                  if (message.error) {
                    reject(new Error(message.error));
                  } else {
                    resolve(message.result);
                  }
                }
              }
            });

            parentPort?.postMessage(Message.create(payload));
          });
        };
      },
    }
  );

  return methods as PromisifyDict<M>;
}
