import type {
  AnyFunction,
  PoolWorkerThread,
  WorkerInterface,
  WorkerPool,
} from "../types";

const STOPPED_WORKER_THREAD: PoolWorkerThread<any> = {
  instance: new Proxy({} as WorkerInterface<any>, {
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
export function createPool<T extends Record<string, AnyFunction>>(
  bridge: { spawn(): WorkerInterface<T> },
  poolSize: number
): WorkerPool<T> {
  let isClosed = false;

  const pool: PoolWorkerThread<T>[] = Array.from({ length: poolSize }, () => ({
    instance: bridge.spawn(),
    currentJob: undefined as undefined | Promise<unknown>,
  }));

  const withFreeWorker = async (
    runJob: (worker: PoolWorkerThread<T>) => Promise<any>
  ) => {
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

  const addWorkerRequest = async <R>(methodName: keyof T, args: unknown[]) => {
    return new Promise((resolve, reject) => {
      withFreeWorker((worker) => {
        try {
          const job = worker.instance[methodName](...args) as Promise<R>;
          job.then(resolve).catch(reject);
          return job;
        } catch (e) {
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

  const proxy = new Proxy({} as WorkerPool<T>, {
    get(_, methodName: string) {
      if (methodName === "close") {
        return () => close();
      }

      if (methodName === "stop" || methodName === "_worker_thread_instance") {
        throw new Error(`'${methodName}' cannot be accessed on a pool worker.`);
      }

      return (...args: unknown[]) => {
        return addWorkerRequest(methodName, args);
      };
    },
  });

  return proxy;
}
