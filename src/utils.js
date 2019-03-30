export function promisify(maybePromise) {
  if (maybePromise && typeof maybePromise.then === 'function') {
    return maybePromise
  }

  return Promise.resolve(maybePromise)
}
