export interface Deferred<T = void> {
  resolve(value: T | PromiseLike<T>): void;
  reject(reason?: any): void;
  promise: Promise<T>;
  get hasResolved(): boolean;
  get hasRejected(): boolean;
}

export function createDeferred<T = void>(): Deferred<T> {
    const { resolve, reject, promise } = Promise.withResolvers<T>();

    const deferred = {
      resolve,
      reject,
      promise: promise.then((result) => {
        deferred.hasResolved = true;
        return result;
      }).catch((e) => {
        deferred.hasRejected = true;
        throw e;
      }),
      hasResolved: false,
      hasRejected: false,
    };

    return deferred;
  }
