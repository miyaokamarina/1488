import { isArray, isFunction } from './Etc';
import { format, FormatOptions, Formatted } from './Format';
import { displayName, IntlState, languageTag, Locale } from './Intl';
import { logger } from './Logger';
import { Tag } from './Tag';

const translateLogger = logger.fork('translate');
const missLogger = translateLogger.fork('missing-message');

// region Internal
/**
 * Translator tag intermediate result.
 */
interface TagBuffer<M> {
    /**
     * Formatted values list.
     */
    readonly formatted: Formatted<M>[];

    /**
     * String parts list.
     */
    readonly strings: string[];

    /**
     * All parts list.
     */
    readonly all: MessageStatic<M>[];
}

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
export const translate = <M>({
    locale: dict,
    library: { [dict]: { [languageTag]: locale, ...messages } = defaultLocale<M>(dict) },
}: IntlState<M>) => {
    return Tag<MessageArg<M>, TagBuffer<M>, MessageStatic<M>>(
        (buffer, string) => {
            buffer.strings.push(string);
            buffer.all.push(string);

            return buffer;
        },
        (buffer, param, formatted?: Formatted<M>) => {
            if (isArray(param)) formatted = format(locale, ...(param as [any]));
            else formatted = format(locale, param, {});

            buffer.formatted.push(formatted);
            buffer.all.push(formatted);

            return buffer;
        },
        (buffer, id = buffer.strings.join('{}'), message = messages[id]) => {
            if (!(id in messages)) {
                missLogger.warning('locale=%o, id=%o', dict, id);

                return buffer.all.join('');
            }

            if (isFunction(message)) {
                return message(stubArgs(locale, buffer.formatted));
            }

            return message;
        },
        {
            formatted: [],
            strings: [],
            all: [],
        },
    );
};
// endregion Translate
