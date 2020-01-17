/**
 * Template literal tag type.
 */
export type Tag<A, Z> = (strings: TemplateStringsArray, ...values: readonly A[]) => Z;

const reduceTag = <A, B, Z>(
    fStr: (buffer: B, string: string) => B,
    fVal: (buffer: B, value: A) => B,
    fFin: (buffer: B) => Z,
    init: B,
    strings: readonly string[],
    values: readonly A[],
) => {
    let i = 0;

    init = fStr(init, strings[i]);

    while (i < values.length) {
        init = fVal(init, values[i]);
        init = fStr(init, strings[++i]);
    }

    return fFin(init);
};

/**
 * Simple template literal tag constructor.
 *
 * @param fStr Strings reducer.
 * @param fVal Values reducer.
 * @param fFin Final reducer.
 * @param init Initial intermediate value.
 * @template {A} Values type.
 * @template {B} Intermediate buffer type.
 * @template {Z} Result type.
 */
export const Tag = <A, B, Z>(
    fStr: (buf: B, string: string) => B,
    fVal: (buf: B, value: A) => B,
    fFin: (buf: B) => Z,
    init: B,
): Tag<A, Z> => {
    return (strings, ...values) => {
        return reduceTag(fStr, fVal, fFin, init, strings, values);
    };
};

/**
 * Raw template literal tag constructor.
 *
 * @param fStr Strings reducer.
 * @param fVal Values reducer.
 * @param fFin Final reducer.
 * @param init Initial intermediate value.
 * @template {A} Values type.
 * @template {B} Intermediate buffer type.
 * @template {Z} Result type.
 */
export const Raw = <A, B, Z>(
    fStr: (buffer: B, string: string) => B,
    fVal: (buffer: B, value: A) => B,
    fFin: (buffer: B) => Z,
    init: B,
): Tag<A, Z> => {
    return ({ raw: strings }, ...values) => {
        return reduceTag(fStr, fVal, fFin, init, strings, values);
    };
};

/**
 * Simple template literal tag.
 */
export const idTag = Tag<unknown, string, string>((b, s) => b + s, (b, x) => b + String(x), s => s, '');

/**
 * Raw template literal tag.
 */
export const rawTag = Raw<unknown, string, string>((b, s) => b + s, (b, x) => b + String(x), s => s, '');
