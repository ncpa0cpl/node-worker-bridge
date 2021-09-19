import { parentPort } from "worker_threads";
import type {
  AnyFunction,
  WorkerMessage,
  WorkerResponsePayload,
} from "../types";
import { MessageType } from "../types";

/** @internal */
export function redirectWorkerMethods<E extends Record<string, AnyFunction>>(
  methods: E
) {
  parentPort!.addListener("message", async (ev) => {
    const data = JSON.parse(ev) as WorkerMessage;

    if (data.type === MessageType.REQUEST) {
      if (data.methodName in methods) {
        const method = methods[data.methodName];

        try {
          const result = await method(...data.params);

          const response: WorkerResponsePayload = {
            type: MessageType.RESPONSE,
            id: data.id,
            result,
          };

          parentPort!.postMessage(JSON.stringify(response));
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

          parentPort!.postMessage(JSON.stringify(response));
        }
      } else {
        const response: WorkerResponsePayload = {
          type: MessageType.RESPONSE,
          id: data.id,
          result: null,
          error: `Undefined exported worker method: [${data.methodName}]`,
        };

        parentPort!.postMessage(JSON.stringify(response));
      }
    }
  });
}
