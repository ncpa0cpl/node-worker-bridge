"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharedApi = void 0;
const types_1 = require("../types");
const uuid = __importStar(require("uuid"));
const worker_threads_1 = require("worker_threads");
/** @internal */
function getSharedApi() {
    const methods = new Proxy({}, {
        get(_, methodName) {
            return (...args) => {
                const payload = {
                    type: types_1.MessageType.REQUEST,
                    id: uuid.v4(),
                    methodName,
                    params: args,
                };
                return new Promise((resolve, reject) => {
                    worker_threads_1.parentPort.addListener("message", (data) => {
                        const eventPayload = JSON.parse(data);
                        if (eventPayload.type === types_1.MessageType.RESPONSE) {
                            if (payload.id === eventPayload.id) {
                                if (eventPayload.error) {
                                    reject(new Error(eventPayload.error));
                                }
                                else {
                                    resolve(eventPayload.result);
                                }
                            }
                        }
                    });
                    worker_threads_1.parentPort.addListener("messageerror", (err) => {
                        reject(err);
                    });
                    worker_threads_1.parentPort?.postMessage(JSON.stringify(payload));
                });
            };
        },
    });
    return methods;
}
exports.getSharedApi = getSharedApi;
