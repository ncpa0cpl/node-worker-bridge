"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerBridge = void 0;
const worker_threads_1 = require("worker_threads");
const message_1 = require("./Message/message");
const request_1 = require("./Shared-Api/request");
const response_1 = require("./Shared-Api/response");
const request_2 = require("./Worker-Exports/request");
const response_2 = require("./Worker-Exports/response");
function WorkerBridge(config, workerExport) {
    const Message = (0, message_1.getMessagePacker)(config);
    if (worker_threads_1.isMainThread) {
        return {
            spawn() {
                const worker = typeof config.file === "string"
                    ? new worker_threads_1.Worker(config.file)
                    : config.file();
                worker.unref();
                (0, response_1.redirectSharedApiCalls)(worker, config, Message);
                return (0, request_2.getWorkerMethodsProxy)(worker, Message);
            },
        };
    }
    const sharedApi = (0, request_1.getSharedApi)(Message);
    const exportedMethods = workerExport(sharedApi);
    (0, response_2.redirectWorkerMethods)(exportedMethods, Message);
    return {
        spawn() {
            throw new Error("Worker Bridge Interface can only be used within the main thread.");
        },
    };
}
exports.WorkerBridge = WorkerBridge;
