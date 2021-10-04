"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerBridge = void 0;
const worker_threads_1 = require("worker_threads");
const message_1 = require("./Message/message");
const worker_pool_1 = require("./Pool/worker-pool");
const request_1 = require("./SharedApi/request");
const response_1 = require("./SharedApi/response");
const request_2 = require("./WorkerExports/request");
const response_2 = require("./WorkerExports/response");
function WorkerBridge(config, workerExport) {
    const { sharedApi = {} } = config;
    const Message = (0, message_1.getMessagePacker)(config);
    if (worker_threads_1.isMainThread) {
        const spawn = (api = {}) => {
            const worker = typeof config.file === "string"
                ? new worker_threads_1.Worker(config.file)
                : config.file();
            worker.unref();
            (0, response_1.redirectSharedApiCalls)(worker, { ...sharedApi, ...api }, Message);
            return (0, request_2.getWorkerMethodsProxy)(worker, Message);
        };
        const createPool = (poolSize, api) => {
            return (0, worker_pool_1.createPool)({ spawn: () => spawn(api) }, poolSize);
        };
        return {
            spawn,
            createPool,
        };
    }
    const api = (0, request_1.getSharedApi)(Message);
    const exportedMethods = workerExport(api);
    (0, response_2.redirectWorkerMethods)(exportedMethods, Message);
    return {
        spawn() {
            throw new Error("Worker Bridge Interface can only be used within the main thread.");
        },
        createPool() {
            throw new Error("Worker Bridge Interface can only be used within the main thread.");
        },
    };
}
exports.WorkerBridge = WorkerBridge;
