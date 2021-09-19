"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirectWorkerMethods = void 0;
const worker_threads_1 = require("worker_threads");
const types_1 = require("../types");
/** @internal */
function redirectWorkerMethods(methods, Message) {
    worker_threads_1.parentPort.addListener("message", async (ev) => {
        const data = Message.read(ev);
        if (data.type === types_1.MessageType.REQUEST) {
            if (data.methodName in methods) {
                const method = methods[data.methodName];
                try {
                    const result = await method(...data.params);
                    const response = {
                        type: types_1.MessageType.RESPONSE,
                        id: data.id,
                        result,
                    };
                    worker_threads_1.parentPort.postMessage(Message.create(response));
                }
                catch (e) {
                    const error = e instanceof Error
                        ? e.message
                        : typeof e === "string"
                            ? e
                            : "Unknown error";
                    const response = {
                        type: types_1.MessageType.RESPONSE,
                        id: data.id,
                        result: null,
                        error,
                    };
                    worker_threads_1.parentPort.postMessage(Message.create(response));
                }
            }
            else {
                const response = {
                    type: types_1.MessageType.RESPONSE,
                    id: data.id,
                    result: null,
                    error: `Undefined exported worker method: [${data.methodName}]`,
                };
                worker_threads_1.parentPort.postMessage(Message.create(response));
            }
        }
    });
}
exports.redirectWorkerMethods = redirectWorkerMethods;
