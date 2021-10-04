"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPool = void 0;
const STOPPED_WORKER_THREAD = {
    instance: new Proxy({}, {
        get() {
            return () => {
                throw new Error("Worker pool has been closed.");
            };
        },
    }),
    currentJob: undefined,
};
/**
 * @internal
 */
function createPool(bridge, poolSize) {
    let isClosed = false;
    const pool = Array.from({ length: poolSize }, () => ({
        instance: bridge.spawn(),
        currentJob: undefined,
    }));
    const withFreeWorker = async (runJob) => {
        if (isClosed) {
            runJob(STOPPED_WORKER_THREAD);
            return;
        }
        const freeWorker = pool.find((entry) => entry.currentJob === undefined);
        if (freeWorker) {
            freeWorker.currentJob = runJob(freeWorker);
            freeWorker.currentJob.finally(() => {
                freeWorker.currentJob = undefined;
            });
            return;
        }
        await Promise.race(pool.map((entry) => entry.currentJob));
        await withFreeWorker(runJob);
    };
    const addWorkerRequest = async (methodName, args) => {
        return new Promise((resolve, reject) => {
            withFreeWorker((worker) => {
                try {
                    const job = worker.instance[methodName](...args);
                    job.then(resolve).catch(reject);
                    return job;
                }
                catch (e) {
                    reject(e);
                    return Promise.resolve();
                }
            });
        });
    };
    const close = () => {
        isClosed = true;
        for (const worker of pool) {
            worker.instance.stop();
        }
    };
    const proxy = new Proxy({}, {
        get(_, methodName) {
            if (methodName === "close") {
                return () => close();
            }
            if (methodName === "stop" || methodName === "_worker_thread_instance") {
                throw new Error(`'${methodName}' cannot be accessed on a pool worker.`);
            }
            return (...args) => {
                return addWorkerRequest(methodName, args);
            };
        },
    });
    return proxy;
}
exports.createPool = createPool;
