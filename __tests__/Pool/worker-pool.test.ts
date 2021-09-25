import type { WorkerInterface } from "../../src";
import { createPool } from "../../src/Pool/worker-pool";
import { sleep, testPromise } from "../helpers";

const resolveAfter = <T>(v: T, ms: number) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(v), ms));

describe("createPool()", () => {
  const fooMock = jest.fn(() => resolveAfter("foo", 100));
  const barMock = jest.fn((a: string, b: number) =>
    resolveAfter(`${a}-${b}`, 100)
  );

  const workerMock: WorkerInterface<{
    foo: typeof fooMock;
    bar: typeof barMock;
  }> = {
    get _worker_thread_instance(): never {
      throw new Error();
    },
    stop() {
      return Promise.resolve(1);
    },
    foo: fooMock,
    bar: barMock,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should execute the called method and return the Promise", async () => {
    const pool = createPool({ spawn: () => workerMock }, 4);

    const promise = pool.foo();

    expect(promise).toEqual(expect.any(Promise));

    const result = await promise;

    expect(result).toEqual("foo");
  });

  it("should correctly provide the arguments to the worker method", async () => {
    const pool = createPool({ spawn: () => workerMock }, 4);

    const promise = pool.bar("Hello", 123);

    expect(promise).toEqual(expect.any(Promise));

    const result = await promise;

    expect(result).toEqual("Hello-123");
  });

  it("should correctly pool worker threads", async () => {
    const fooPromiseOne = testPromise<string>();
    const fooPromiseTwo = testPromise<string>();
    const fooPromiseThree = testPromise<string>();
    const fooPromiseFour = testPromise<string>();
    const fooPromiseFive = testPromise<string>();

    const onF1Resolve = jest.fn();
    const onF2Resolve = jest.fn();
    const onF3Resolve = jest.fn();
    const onF4Resolve = jest.fn();
    const onF5Resolve = jest.fn();
    const onF6Resolve = jest.fn();
    const onF7Resolve = jest.fn();

    const pool = createPool({ spawn: () => workerMock }, 4);

    fooMock.mockImplementation(() => fooPromiseOne.wait);
    const f1 = pool.foo();
    f1.then(onF1Resolve);

    await sleep(1);

    fooMock.mockImplementation(() => fooPromiseTwo.wait);
    const f2 = pool.foo();
    f2.then(onF2Resolve);

    await sleep(1);

    fooMock.mockImplementation(() => fooPromiseThree.wait);
    const f3 = pool.foo();
    f3.then(onF3Resolve);

    await sleep(1);

    fooMock.mockImplementation(() => fooPromiseFour.wait);
    const f4 = pool.foo();
    f4.then(onF4Resolve);

    await sleep(1);

    fooMock.mockImplementation(() => fooPromiseFive.wait);
    const f5 = pool.foo();
    f5.then(onF5Resolve);

    const f6 = pool.foo();
    f6.then(onF6Resolve);

    const f7 = pool.foo();
    f7.then(onF7Resolve);

    await sleep(5);

    expect(fooMock).toHaveBeenCalledTimes(4);

    expect(onF1Resolve).toHaveBeenCalledTimes(0);
    expect(onF2Resolve).toHaveBeenCalledTimes(0);
    expect(onF3Resolve).toHaveBeenCalledTimes(0);
    expect(onF4Resolve).toHaveBeenCalledTimes(0);
    expect(onF5Resolve).toHaveBeenCalledTimes(0);
    expect(onF6Resolve).toHaveBeenCalledTimes(0);
    expect(onF7Resolve).toHaveBeenCalledTimes(0);

    fooPromiseOne.resolve("foo-1");

    await sleep(5);

    expect(fooMock).toHaveBeenCalledTimes(5);

    expect(onF1Resolve).toHaveBeenCalledTimes(1);
    expect(onF2Resolve).toHaveBeenCalledTimes(0);
    expect(onF3Resolve).toHaveBeenCalledTimes(0);
    expect(onF4Resolve).toHaveBeenCalledTimes(0);
    expect(onF5Resolve).toHaveBeenCalledTimes(0);
    expect(onF6Resolve).toHaveBeenCalledTimes(0);
    expect(onF7Resolve).toHaveBeenCalledTimes(0);

    expect(onF1Resolve).toHaveBeenCalledWith("foo-1");

    fooPromiseFour.resolve("foo-4");

    await sleep(5);

    expect(fooMock).toHaveBeenCalledTimes(6);

    expect(onF1Resolve).toHaveBeenCalledTimes(1);
    expect(onF2Resolve).toHaveBeenCalledTimes(0);
    expect(onF3Resolve).toHaveBeenCalledTimes(0);
    expect(onF4Resolve).toHaveBeenCalledTimes(1);
    expect(onF5Resolve).toHaveBeenCalledTimes(0);
    expect(onF6Resolve).toHaveBeenCalledTimes(0);
    expect(onF7Resolve).toHaveBeenCalledTimes(0);

    expect(onF4Resolve).toHaveBeenCalledWith("foo-4");

    fooPromiseThree.resolve("foo-3");

    await sleep(5);

    expect(fooMock).toHaveBeenCalledTimes(7);

    expect(onF1Resolve).toHaveBeenCalledTimes(1);
    expect(onF2Resolve).toHaveBeenCalledTimes(0);
    expect(onF3Resolve).toHaveBeenCalledTimes(1);
    expect(onF4Resolve).toHaveBeenCalledTimes(1);
    expect(onF5Resolve).toHaveBeenCalledTimes(0);
    expect(onF6Resolve).toHaveBeenCalledTimes(0);
    expect(onF7Resolve).toHaveBeenCalledTimes(0);

    expect(onF3Resolve).toHaveBeenCalledWith("foo-3");

    fooPromiseTwo.resolve("foo-2");

    await sleep(5);

    expect(fooMock).toHaveBeenCalledTimes(7);

    expect(onF1Resolve).toHaveBeenCalledTimes(1);
    expect(onF2Resolve).toHaveBeenCalledTimes(1);
    expect(onF3Resolve).toHaveBeenCalledTimes(1);
    expect(onF4Resolve).toHaveBeenCalledTimes(1);
    expect(onF5Resolve).toHaveBeenCalledTimes(0);
    expect(onF6Resolve).toHaveBeenCalledTimes(0);
    expect(onF7Resolve).toHaveBeenCalledTimes(0);

    expect(onF2Resolve).toHaveBeenCalledWith("foo-2");

    fooPromiseFive.resolve("foo-last");

    await sleep(5);

    expect(fooMock).toHaveBeenCalledTimes(7);

    expect(onF1Resolve).toHaveBeenCalledTimes(1);
    expect(onF2Resolve).toHaveBeenCalledTimes(1);
    expect(onF3Resolve).toHaveBeenCalledTimes(1);
    expect(onF4Resolve).toHaveBeenCalledTimes(1);
    expect(onF5Resolve).toHaveBeenCalledTimes(1);
    expect(onF6Resolve).toHaveBeenCalledTimes(1);
    expect(onF7Resolve).toHaveBeenCalledTimes(1);

    expect(onF5Resolve).toHaveBeenCalledWith("foo-last");
    expect(onF6Resolve).toHaveBeenCalledWith("foo-last");
    expect(onF7Resolve).toHaveBeenCalledWith("foo-last");
  });

  it("should throw an error for jobs started after closing the pool", async () => {
    const fooPromiseOne = testPromise<string>();
    const fooPromiseTwo = testPromise<string>();
    const fooPromiseThree = testPromise<string>();

    const pool = createPool({ spawn: () => workerMock }, 1);

    fooMock.mockImplementation(() => fooPromiseOne.wait);
    const f1 = pool.foo();

    await sleep(1);

    fooMock.mockImplementation(() => fooPromiseTwo.wait);
    pool.foo().catch((e) => {
      expect(e).toEqual(Error("Worker pool has been closed."));
    });

    await sleep(1);
    pool.close();

    fooMock.mockImplementation(() => fooPromiseThree.wait);
    pool.foo().catch((e) => {
      expect(e).toEqual(Error("Worker pool has been closed."));
    });

    expect.assertions(3);

    fooPromiseOne.resolve("f1");
    fooPromiseTwo.resolve("f2");
    fooPromiseThree.resolve("f3");

    await f1.then((r) => {
      expect(r).toEqual("f1");
    });
  });
});
