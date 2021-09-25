export const testPromise = <T>() => {
  let resolve: (value: T | PromiseLike<T>) => void = () => {};
  let reject: (reason?: any) => void = () => {};

  const p = new Promise<T>((rsl, rjc) => {
    resolve = rsl;
    reject = rjc;
  });

  return {
    wait: p,
    resolve,
    reject,
  };
};

export function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}
