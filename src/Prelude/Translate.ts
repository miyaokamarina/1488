import { format, FormatOptions, Formatted } from './Format';
import { displayName, IntlState, languageTag, Locale } from './Intl';
import { logger } from './Logger';

// region Internal
/**
 * Generates stub arguments for dynamic messages.
 *
 * @param locale Active locale.
 * @param formatted Real formatted value wrappers.
 */
function* stubArgs<M>(locale: string, formatted: readonly Formatted<M>[]) {
    yield* formatted;

    while (true) {
        yield format(locale, NaN, {});
    }
}

const defaultLocale = <M>(locale: string): Locale<M> => ({
    [displayName]: locale,
    [languageTag]: locale,
});
// endregion Internal

// region Types
/**
 * Message type.
 */
export type Message<M> = MessageStatic<M> | MessageDynamic<M>;

/**
 * Static message type.
 */
export type MessageStatic<M> = M | string | number | boolean | null | undefined | Formatted<M>;

/**
 * Dynamic (parametric) message type.
 *
 * @param params Iterator of formatted values. May yield more values than was
 * passed to `translateMessage` tag, but all “fake” values will be just a
 * formatted `NaN`s.
 */
export type MessageDynamic<M> = (args: IterableIterator<Formatted<M>>) => MessageStatic<M>;

/**
 * Message translator template argument type.
 */
export type MessageArg<M> = unknown | readonly [unknown, (FormatOptions<M> | null)?];
// endregion Types

// region Translate
/**
 * Translates a message using given state. Message identifier will be inferred
 * as all string parts of template string joined using `'{}'`. E.g. for
 * <code>\`foo ${42} bar\`</code> template will be inferred `'foo {} bar'`
 * message identifier.
 *
 * All values passed to template string will be formatted. If you pass single
 * value (e.g. `42`, `'foo'`, `new Date()`), it will be formatted without
 * options. If you need to specify options, you should pass tuple of value and
 * options (e.g. `[new Date(), 'full']`).
 *
 * @example ```javascript
 * const ru = {
 *     'name': 'Русский',
 *     'locale': 'ru',
 *     'fallback': ['en'],
 *     'You sucked {} times.': ([n]) => select(n, {
 *         0: 'Вы не соснули.',
 *         1: 'Вы соснули разулю.',
 *         2: 'Вы соснули дважды.',
 *         few: `Вы соснули ${n} раза.`,
 *         other: `Вы соснули ${n} раз.`,
 *     }),
 * };
 *
 * const state = IntlState('ru', [], [ru]);
 *
 * console.log(`
 *     ${translate(state)`You sucked ${0} times.`}
 *     ${translate(state)`You sucked ${1} times.`}
 *     ${translate(state)`You sucked ${2} times.`}
 *     ${translate(state)`You sucked ${3} times.`}
 *     ${translate(state)`You sucked ${5} times.`}
 *     ${translate(state)`You sucked ${21} times.`}
 *     ${translate(state)`You sucked ${1488} times.`}
 *     ${translate(state)`You sucked ${[12309, { numberingSystem: 'hanidec' }]} times.`}
 * `);
 * ```
 *
 * Output:
 *
 * ```
 * Вы не соснули.
 * Вы соснули разулю.
 * Вы соснули дважды.
 * Вы соснули 3 раза.
 * Вы соснули 5 раз.
 * Вы соснули 21 раз.
 * Вы соснули 1 488 раз.
 * Вы соснули 一二 三〇九 раз.
 * ```
 *
 * @param state Target state.
 */
export const translate = <M>({ locale: localeId, library }: IntlState<M>) => {
    const locale = library[localeId] || defaultLocale<M>(localeId);
    const localeTag = locale[languageTag];

    return (tsa: TemplateStringsArray, ...params: readonly unknown[]) => {
        const strings = [] as string[];
        const all = [] as MessageStatic<M>[];
        const formats = [] as Formatted<M>[];

        let string: string;
        let param: unknown;
        let formatted: Formatted<M>;
        let i = 0;
        const l = params.length;

        for (; i < l; i++) {
            string = tsa[i];

            strings.push(string);
            all.push(string);

            param = params[i];

            if (Array.isArray(param)) formatted = format(localeTag, ...(param as [any]));
            else formatted = format(localeTag, param, {});

            formats.push(formatted);
            all.push(formatted);
        }

        string = tsa[l];

        strings.push(string);
        all.push(string);

        const id = strings.join('{}');
        const message = locale[id] as any;

        if (!(id in locale)) {
            logger.warning`intl:missing-message +locale=${localeId}`('%o', id);

            return all.join('');
        }

        if (typeof message === 'function') {
            return message(stubArgs(localeTag, formats));
        }

        return message;
    };
};
// endregion Translate
