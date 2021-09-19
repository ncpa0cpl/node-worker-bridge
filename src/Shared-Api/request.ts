import type {
  AnyFunction,
  PromisifyDict,
  WorkerMessage,
  WorkerRequestPayload,
} from "../types";
import { MessageType } from "../types";
import * as uuid from "uuid";
import { parentPort } from "worker_threads";
import type { MessagePacker } from "..";

/** @internal */
export function getSharedApi<M extends Record<string, AnyFunction>>(
  Message: MessagePacker
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
            parentPort!.addListener("message", (data: string) => {
              const eventPayload = Message.read(data);

              if (eventPayload.type === MessageType.RESPONSE) {
                if (payload.id === eventPayload.id) {
                  if (eventPayload.error) {
                    reject(new Error(eventPayload.error));
                  } else {
                    resolve(eventPayload.result);
                  }
                }
              }
            });

            parentPort!.addListener("messageerror", (err) => {
              reject(err);
            });

            parentPort?.postMessage(Message.create(payload));
          });
        };
      },
    }
  );

  return methods as PromisifyDict<M>;
}
