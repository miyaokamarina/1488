/**
 * Checks whether `x` is an array.
 *
 * @param x Value to check.
 */
export const isArray = (x: unknown): x is readonly unknown[] => Array.isArray(x);

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

/**
 * Checks whether `x` is an object.
 *
 * @param x Value to check.
 */
export const isObject = (x: unknown): x is object => typeof x == 'object' && x != null;

/**
 * Checks whether `x` is a string.
 *
 * @param x Value to check.
 */
export const isString = (x: unknown): x is string => typeof x == 'string';

/**
 * Checks whether `x` is a number.
 *
 * @param x Value to check.
 */
export const isNumber = (x: unknown): x is number => typeof x == 'number';

/**
 * Reduces an object to a single value.
 *
 * @param reducer Reducer.
 * @param init Initial value.
 * @param obj Source object.
 */
export const objectReduce = <K extends keyof any, V, B>(
    reducer: (buffer: B, entry: readonly [K, V]) => B,
    init: B,
    obj: ReadonlyRecord<K, V>,
): B => {
    return (Object.entries(obj) as any[]).reduce(reducer, init);
};

/**
 * Applies mapping function to each key-value pair and returns new object.
 *
 * @param map Mapping function.
 * @param object Source object.
 */
export const objectMap = <K extends keyof any, V, L extends keyof any, U>(
    object: ReadonlyRecord<K, V>,
    map: (entry: readonly [K, V]) => readonly [L, U],
): ReadonlyRecord<L, U> => {
    return Object.fromEntries(Object.entries(object).map(map as any)) as any;
};

/**
 * Converts arguments to string and concatenates them.
 *
 * @param a Left operand.
 * @param b Right operand.
 */
export const stringConcat = (a: unknown, b: unknown) => String(a) + String(b);

/**
 * Checks whether `x` is function.
 *
 * @param x Value to check.
 */
export const isFunction = (x: unknown): x is Function => typeof x == 'function';
