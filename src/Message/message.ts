import type { MessagePacker, WorkerBridgeConfig, WorkerMessage } from "..";

export const getMessagePacker = (config: WorkerBridgeConfig): MessagePacker => {
  const { parseMessagesWithJSON = false } = config;

  if (parseMessagesWithJSON) {
    return {
      read(v: any) {
        return JSON.parse(v) as WorkerMessage;
      },
      create(v: WorkerMessage) {
        return JSON.stringify(v);
      },
    };
  }

  return {
    read(v: any) {
      return v as WorkerMessage;
    },
    create(v: WorkerMessage) {
      return v;
    },
  };
};
