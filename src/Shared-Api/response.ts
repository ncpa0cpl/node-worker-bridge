import type { Worker } from "worker_threads";
import type { MessagePacker } from "..";
import type {
  AnyFunction,
  WorkerBridgeConfig,
  WorkerResponsePayload,
} from "../types";
import { MessageType } from "../types";

/** @internal */
export function redirectSharedApiCalls(
  w: Worker,
  sharedApi: Record<string, AnyFunction>,
  Message: MessagePacker
) {
  w.addListener("message", async (ev) => {
    const data = Message.read(ev);

    if (data.type === MessageType.REQUEST) {
      if (data.methodName in sharedApi) {
        const method = sharedApi[data.methodName];
        try {
          const result = await method(...data.params);

          const response: WorkerResponsePayload = {
            type: MessageType.RESPONSE,
            id: data.id,
            result,
          };

          w.postMessage(Message.create(response));
        } catch (e) {
          const error =
            e instanceof Error
              ? e.message
              : typeof e === "string"
              ? e
              : "Unknown error";

          const response: WorkerResponsePayload = {
            type: MessageType.RESPONSE,
            id: data.id,
            result: null,
            error,
          };

          w.postMessage(Message.create(response));
        }
      } else {
        const response: WorkerResponsePayload = {
          type: MessageType.RESPONSE,
          id: data.id,
          result: null,
          error: `Undefined api call: [${data.methodName}]`,
        };

        w.postMessage(Message.create(response));
      }
    }
  });
}
