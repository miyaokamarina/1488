import { isArray, isObject, isString, objectReduce, ReadonlyRecord, stringConcat } from './Etc';
import { Tag } from './Tag';

/**
 * Unreduced CSS classes type.
 */
export type Classes = boolean | string | ReadonlyRecord<string, boolean> | readonly Classes[];

// Unique CSS symbols counter.
let i = 0;

/**
 * CSS symbol constructor template literal tag.
 */
export const csym = Tag<unknown, string, string>(stringConcat, stringConcat, y => `--${i++}-${y}`, '');

/**
 * CSS variable value getter.
 *
 * @param csym CSS symbol.
 */
export const cvar = (csym: string) => `var(${csym})`;

/**
 * Reduces strings, arrays of strings, boolean-string expressions and boolean
 * objects to a single classname string.
 *
 * @param classes Arguments array.
 */
export const classes = (...classes: Classes[]) => {
    const buffer: string[] = [];

    while (classes.length) {
        let c = classes.shift()!;

        if (isString(c) && (c = c.replace(/\s+/gu, ' ').trim())) {
            buffer.push(c);
        } else if (isArray(c)) {
            classes.unshift(c);
        } else if (isObject(c)) {
            objectReduce((b, [k, v]) => (v ? [...b, k] : b), classes, c);
        }
    }

    return buffer.join(' ');
};
