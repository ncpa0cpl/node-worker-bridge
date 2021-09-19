import type { Worker } from "worker_threads";
import type {
  WorkerBridgeConfig,
  WorkerMessage,
  WorkerResponsePayload,
} from "../types";
import { MessageType } from "../types";

/** @internal */
export function redirectSharedApiCalls(w: Worker, config: WorkerBridgeConfig) {
  const { sharedApi = {} } = config;

  w.addListener("message", async (ev) => {
    const data = JSON.parse(ev) as WorkerMessage;

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

          w.postMessage(JSON.stringify(response));
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

          w.postMessage(JSON.stringify(response));
        }
      } else {
        const response: WorkerResponsePayload = {
          type: MessageType.RESPONSE,
          id: data.id,
          result: null,
          error: `Undefined api call: [${data.methodName}]`,
        };

        w.postMessage(JSON.stringify(response));
      }
    }
  });
}
