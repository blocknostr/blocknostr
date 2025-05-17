
/**
 * A polyfill for Promise.any that works in older browsers
 * Returns the value of the first resolved promise or an AggregateError if all promises reject
 */
export async function promiseAny<T>(promises: Promise<T>[]): Promise<T> {
  if (!promises.length) {
    throw new Error("No promises provided to promiseAny");
  }
  
  // Don't use native Promise.any since it might not be available
  // Implement a polyfill version instead
  return new Promise((resolve, reject) => {
    let errors: Error[] = [];
    let pending = promises.length;
    
    if (pending === 0) {
      reject(new Error("All promises rejected"));
      return;
    }
    
    promises.forEach((promise, i) => {
      Promise.resolve(promise)
        .then(value => {
          resolve(value);
        })
        .catch(error => {
          errors[i] = error;
          pending--;
          if (pending === 0) {
            // Create an error that contains all rejection reasons
            const aggregateError = new Error("All promises rejected");
            (aggregateError as any).errors = errors;
            reject(aggregateError);
          }
        });
    });
  });
}
