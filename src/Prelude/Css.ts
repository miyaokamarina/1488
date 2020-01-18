import { ReadonlyRecord } from './Etc';

/**
 * Unreduced CSS classes type.
 */
export type Classes =
    | undefined
    | null
    | boolean
    | string
    | ReadonlyRecord<string, boolean | null | undefined>
    | readonly Classes[];

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

        if (typeof c === 'string' && (c = c.replace(/\s+/gu, ' ').trim())) {
            // If is string and not empty when normalized, push to buffer as is ↓
            buffer.push(c);
        } else if (Array.isArray(c)) {
            // If is array, add to queue ↓
            classes.unshift(...c);
        } else if (typeof c === 'object' && c) {
            const entries = Object.entries(c);

            for (let i = entries.length - 1; i > -1; i--) {
                if (entries[i][1]) classes.unshift(entries[i][0]);
            }
        }
    }

    return buffer.join(' ');
};
