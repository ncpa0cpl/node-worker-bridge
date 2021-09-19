"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirectSharedApiCalls = void 0;
const types_1 = require("../types");
/** @internal */
function redirectSharedApiCalls(w, config) {
    const { sharedApi = {} } = config;
    w.addListener("message", async (ev) => {
        const data = JSON.parse(ev);
        if (data.type === types_1.MessageType.REQUEST) {
            if (data.methodName in sharedApi) {
                const method = sharedApi[data.methodName];
                try {
                    const result = await method(...data.params);
                    const response = {
                        type: types_1.MessageType.RESPONSE,
                        id: data.id,
                        result,
                    };
                    w.postMessage(JSON.stringify(response));
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
                    w.postMessage(JSON.stringify(response));
                }
            }
            else {
                const response = {
                    type: types_1.MessageType.RESPONSE,
                    id: data.id,
                    result: null,
                    error: `Undefined api call: [${data.methodName}]`,
                };
                w.postMessage(JSON.stringify(response));
            }
        }
    });
}
exports.redirectSharedApiCalls = redirectSharedApiCalls;
