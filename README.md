## Usage

### Expose Worker methods to the main thread

```ts
// worker.cjs
import { WorkerBridge } from "@ncpa0cpl/node-worker-bridge";

export const worker = WorkerBridge({ file: __filename }, () => {
  const calculatePi = () => {
    return "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";
  };

  return { calculatePi };
});
```

```ts
// main.cjs
import { worker } from "./worker.cjs";

function main() {
  // create a pool of 4 workers
  const workerPool = worker.createPool(4);

  const piCalcResult1 = await workerPool.calculatePi();
  console.log(piCalcResult1); // will print the pi number

  // terminate the pool so the program can exit
  workerPool.close();
}

main();
```

### Expose methods from the main thread to the Worker

```ts
// worker.cjs
import { WorkerBridge } from "@ncpa0cpl/node-worker-bridge";

type MainThreadMethods = {
  getGlobalState(): { foo: string };
};

export const worker = WorkerBridge(
  { file: __filename },
  (mainThreadMethods: MainThreadMethods) => {
    const loopbackFoo = async () => {
      return (await mainThreadMethods.getGlobalState()).foo;
    };

    return { loopbackFoo };
  }
);
```

```ts
// main.cjs
import { worker } from "./worker.cjs";

const globalState = {
  foo: "Hello",
};

function main() {
  // create a pool of 4 workers
  const workerPool = worker.createPool(4, {
    getGlobalState: () => {
      return { ...globalState };
    },
  });

  const foo = await workerPool.loopbackFoo();
  console.log(foo); // will print "Hello"

  // terminate the pool so the program can exit
  workerPool.close();
}

main();
```
