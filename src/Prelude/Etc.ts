/**
 * Clamp function.
 *
 * @param lo Lower limit.
 * @param x A number.
 * @param up Upper limit.
 */
export const clamp = (lo: number, x: number, up: number) => Math.max(lo, Math.min(x, up));

/**
 * Converts degrees to radians.
 *
 * @param deg
 */
export const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Creates promise waiting specified number of milliseconds, then resolving to
 * given value.
 *
 * @param time Milliseconds to wait.
 */
export const wait = (time: number) => {
    return new Promise(resolve => {
        const timeout = setTimeout(() => {
            clearTimeout(timeout);
            resolve();
        }, time);
    });
};

/**
 * Record type alias.
 */
export type ReadonlyRecord<K extends keyof any, V> = { readonly [L in K]: V };

/**
 * Removes write protection.
 */
export type Mutable<A> = {
    -readonly [K in keyof A]: A[K];
};
