import { hsl } from '@ripreact/hsl';
import hash from 'string-hash';

// import { DevtoolsTransport, LevelFilter, Logger, PrefixPreprocessor } from '@ripreact/logger';
//
// export const logger = Logger({
//     plugins: [
//         LevelFilter({
//             level: 'flood',
//         }),
//         PrefixPreprocessor({
//             prefix: ['fuck-anime', 'front'],
//         }),
//         DevtoolsTransport({
//             filterSegments: ({ name }, i, [head]) => {
//                 switch (name) {
//                     case 'fuck-anime':
//                         return i > 0;
//                     case 'front':
//                         return i != 1 || head.name != 'fuck-anime';
//                 }
//
//                 return true;
//             },
//         }),
//     ],
// });

const compare = new Intl.Collator('en-us', { numeric: true, sensitivity: 'base' }).compare;

const trim = (x: string) => x.trim();

const normalizeNamespace = (namespace: string) => {
    return namespace
        .split(/(?:\s*:+)\s*/)
        .join(':')
        .trim();
};

const normalizeTags = (tags: readonly string[]) => {
    return Array.from(new Set(tags.map(trim)))
        .filter(Boolean)
        .sort(compare);
};

/**
 * Applies filter and preprocessor plugins to a message.
 *
 * @param f List of filter plugins.
 * @param p List of preprocessor plugins.
 * @param m Message.
 * @returns Preprocessed message or `null` if message was rejected by filters.
 */
export const applyPlugins = (f: readonly LoggerFilter[], p: readonly LoggerPreprocessor[], m: LogMessage) => {
    for (let i = 0, l = f.length; i < l; i++) if (!f[i].filter(m)) return null;
    for (let i = 0, l = p.length; i < l; i++) m = p[i].preprocess(m) || m;

    return { ...m, namespace: normalizeNamespace(m.namespace), tags: normalizeTags(m.tags) };
};

// region Types
/**
 * Message level.
 */
export enum LogLevel {
    /**
     * Chthonic horror; application owner should be warned immediately.
     */
    Zalgo = 1,

    /**
     * Everything’s bad; application owner should be notified as soon as possible.
     */
    Disaster = 2,

    /**
     * Application crashed and can’t restore.
     */
    Crash = 3,

    /**
     * Application errored and can safely restore.
     */
    Error = 4,

    /**
     * Something meh happened.
     */
    Warning = 5,

    /**
     * Something good happened.
     */
    Ok = 6,

    /**
     * Regular debug message.
     */
    Log = 7,

    /**
     * Verbose debug message.
     */
    Trace = 8,

    /**
     * You may surround every statement with this messages if you want.
     */
    Silly = 9,
}

/**
 * Log entry.
 */
export interface LogMessage {
    /**
     * Message timestamp in milliseconds.
     */
    readonly time: number;

    /**
     * Message severity level.
     *
     * 1. `apocalypse` — App owner should be alerted immediately.
     * 2. `disaster` — App owner should be notified the next morning.
     * 3. `crash` — App owner may be notified depending on circumstances.
     * 4. `error` — App can recover on its own.
     * 5. `warning` — Nothing critical.
     * 6. `ok` — Something good happened.
     * 7. `log` — Regular message in development.
     * 8. `trace` — Helps you to locate errors.
     * 9. `flood` — Use it to flood your console.
     */
    readonly level: LogLevel;

    /**
     * Message namespace.
     */
    readonly namespace: string;

    /**
     * Message tags array.
     */
    readonly tags: readonly string[];

    /**
     * Message data.
     */
    readonly payload: readonly unknown[];
}

/**
 * Logger plugin.
 */
export interface LoggerPlugin {
    /**
     * Filters messages before applying other plugins.
     */
    readonly filter?: (message: LogMessage) => boolean;

    /**
     * Preprocesses messages before calculating diffs and passing to transports.
     */
    readonly preprocess?: (message: LogMessage) => LogMessage | null | undefined | void;

    /**
     * Transport method provided by plugin.
     */
    readonly transport?: (message: LogMessage) => void;
}

/**
 * @see LoggerPlugin
 */
export interface LoggerFilter extends LoggerPlugin {
    /**
     * @see LoggerPlugin.filter
     */
    readonly filter: (message: LogMessage) => boolean;
}

/**
 * @see LoggerPlugin
 */
export interface LoggerPreprocessor extends LoggerPlugin {
    /**
     * @see LoggerPlugin.preprocess
     */
    readonly preprocess: (message: LogMessage) => LogMessage | null | undefined | void;
}

/**
 * @see LoggerPlugin
 */
export interface LoggerTransport extends LoggerPlugin {
    /**
     * @see LoggerPlugin.transport
     */
    readonly transport: (message: LogMessage) => void;
}

/**
 * Logger constructor options.
 */
export interface LoggerOptions {
    /**
     * Logger namespace.
     */
    readonly namespace?: string;

    /**
     * Logger tags array.
     */
    readonly tags?: readonly string[];

    /**
     * Array of plugins.
     */
    readonly plugins?: readonly LoggerPlugin[];

    /**
     * Array of filter plugins. May be specified explicitly, but actually this
     * field intended to internal use.
     */
    readonly filters?: readonly LoggerFilter[];

    /**
     * Array of preprocessor plugins. May be specified explicitly, but actually this
     * field intended to internal use.
     */
    readonly preprocessors?: readonly LoggerPreprocessor[];

    /**
     * Array of transport plugins. May be specified explicitly, but actually this
     * field intended to internal use.
     */
    readonly transports?: readonly LoggerTransport[];
}
// endregion Types

/**
 * Logger ¯\_(ツ)_/¯
 */
export class Logger {
    /**
     * List of filter plugins.
     */
    readonly filters: readonly LoggerFilter[];

    /**
     * List of preprocessor plugins.
     */
    readonly preprocessors: readonly LoggerPreprocessor[];

    /**
     * List of transport plugins.
     */
    readonly transports: readonly LoggerTransport[];

    /**
     * Logger namespace.
     */
    readonly namespace: string;

    /**
     * Tags associated with logger.
     */
    readonly tags: readonly string[];

    constructor(options = {} as LoggerOptions) {
        const { namespace = '', plugins = [] } = options;

        const tags = normalizeTags(options.tags || []);
        const filters = Array.from(options.filters || []);
        const preprocessors = Array.from(options.preprocessors || []);
        const transports = Array.from(options.transports || []);

        for (let i = 0, l = plugins.length; i < l; i++) {
            const plugin = plugins[i];

            if (plugin.filter) filters.push(plugin as LoggerFilter);
            if (plugin.preprocess) preprocessors.push(plugin as LoggerPreprocessor);
            if (plugin.transport) transports.push(plugin as LoggerTransport);
        }

        this.namespace = normalizeNamespace(namespace);
        this.tags = tags;
        this.filters = filters;
        this.preprocessors = preprocessors;
        this.transports = transports;
    }

    /**
     * Internal message used to prepare and write message to transports.
     *
     * @param level Message level.
     * @param payload Message payload.
     */
    protected write(level: number, payload: readonly unknown[]) {
        let message = applyPlugins(this.filters, this.preprocessors, {
            time: Date.now(),
            level,
            namespace: this.namespace,
            tags: this.tags,
            payload,
        });

        const { transports } = this;

        if (message) for (let i = 0, l = transports.length; i < l; i++) transports[i].transport(message);
    }

    /**
     * Creates new logger with suffix appended to its namespace.
     *
     * @param suffix Suffix to append to namespace.
     */
    fork(suffix?: string) {
        suffix = suffix == null ? '' : ':' + suffix;

        return new Logger({
            ...this,
            namespace: this.namespace + suffix,
        });
    }

    /**
     * Creates new logger with associated tags.
     *
     * @param tags Tags to add to logger.
     */
    tag(...tags: readonly string[]) {
        return new Logger({
            ...this,
            tags: this.tags.concat(tags),
        });
    }

    /**
     * Chthonic horror; application owner should be alerted immediately.
     *
     * Method is bound to the logger instance amd may be used as callback.
     */
    readonly hecomes = (...payload: readonly unknown[]) => this.write(LogLevel.Zalgo, payload);

    /**
     * Everything’s bad; application owner should be notified as soon as possible.
     *
     * Method is bound to the logger instance amd may be used as callback.
     */
    readonly disaster = (...payload: readonly unknown[]) => this.write(LogLevel.Disaster, payload);

    /**
     * Application crashed and can’t restore.
     *
     * Method is bound to the logger instance amd may be used as callback.
     */
    readonly crash = (...payload: readonly unknown[]) => this.write(LogLevel.Crash, payload);

    /**
     * Application errored and can safely restore.
     *
     * Method is bound to the logger instance amd may be used as callback.
     */
    readonly error = (...payload: readonly unknown[]) => this.write(LogLevel.Error, payload);

    /**
     * Something meh happened.
     *
     * Method is bound to the logger instance amd may be used as callback.
     */
    readonly warning = (...payload: readonly unknown[]) => this.write(LogLevel.Warning, payload);

    /**
     * Something good happened.
     *
     * Method is bound to the logger instance amd may be used as callback.
     */
    readonly ok = (...payload: readonly unknown[]) => this.write(LogLevel.Ok, payload);

    /**
     * Regular debug message.
     *
     * Method is bound to the logger instance amd may be used as callback.
     */
    readonly log = (...payload: readonly unknown[]) => this.write(LogLevel.Log, payload);

    /**
     * Verbose debug message.
     *
     * Method is bound to the logger instance amd may be used as callback.
     */
    readonly trace = (...payload: readonly unknown[]) => this.write(LogLevel.Trace, payload);

    /**
     * You may surround every statement with this messages if you want.
     *
     * Method is bound to the logger instance amd may be used as callback.
     */
    readonly silly = (...payload: readonly unknown[]) => this.write(LogLevel.Silly, payload);
}

// region Level filter
/**
 * Retrieves level from environment / local storage.
 *
 * @param [explicit] Maximum allowed message level as specified by user.
 */
const getLevel = (
    explicit = (localStorage.getItem('FUCK_ANIME_LOGGER_LEVEL') || process.env.FUCK_ANIME_LOGGER_LEVEL) as
        | string
        | null
        | undefined,
) => {
    return (
        ((LogLevel[explicit as any] as any) as LogLevel | undefined) ||
        (process.env.NODE_ENV === 'development'
            ? LogLevel.Trace
            : process.env.NODE_ENV === 'production'
            ? LogLevel.Warning
            : null)
    );
};

/**
 * Level filter. Allows to filter messages by severity level.
 */
export class LevelFilter implements LoggerFilter {
    /**
     * Highest allowed level.
     */
    level: LogLevel;

    /**
     * @param level Highest allowed severity level.
     *
     * May be overridden by `FUCK_ANIME_LOGGER_LEVEL` environment variable or local storage key.
     *
     * When specified, the `FUCK_ANIME_LOGGER_LEVEL` variable should be a valid level name (case insensitive).
     */
    constructor(level = LogLevel.Warning) {
        this.level = getLevel() ?? level;

        window.addEventListener('storage', event => {
            if (event.key === 'FUCK_ANIME_LOGGER_LEVEL') {
                this.level = getLevel(event.newValue) ?? level;
            }
        });
    }

    filter(message: LogMessage) {
        return message.level <= this.level;
    }
}
// endregion Level filter

// region Devtools transport
// region Internals
const emojiCode = [
    '\u{1F440}', //                         0 Eyes
    '\u{1F92C}', //                         1 Fuck!
    '\u{1F621}', //                         2 Rage
    '\u{1F620}', //                         3 Angry
    '\u{1F4A9}', //                         4 Shit
    '\u{1F937}\u{200D}\u{2640}\u{FE0F}', // 5 Shrug
    '\u{1F44C}', //                         6 Ok
    '\u{270D}\u{FE0F}', //                  7 Writing
    '\u{1F43E}', //                         8 Paw
    '\u{1F440}', //                         9 Eyes
];

const colorCode = [290, -20, 0, 12.2, 24, 121, 180, 240, 266, 310];

/**
 * Media query to check if user prefers light color scheme, so probably their devtools is also light.
 */
const preferLight = matchMedia('(prefers-color-scheme: light)');

/**
 * Retrieves preferred text lightness from environment or local storage,
 * or guesses it based on theme preference.
 *
 * @param [option] Lightness value as specified in plugin settings.
 * @param [explicit] Lightness value as specified by user.
 */
const getLightness = (
    option?: number,
    explicit = (localStorage.getItem('FUCK_ANIME_LOGGER_LIGHTNESS') || process.env.FUCK_ANIME_LOGGER_LIGHTNESS) as
        | string
        | null
        | undefined,
) => {
    // 1. Try to parse explicit value.
    // 2. Try to fallback to plugin option.
    // 3. Use default.
    return parseFloat(explicit!) || (option ?? (preferLight.matches ? 40 : 55));
};

/**
 * Retrieves emoji preference from environment or local storage.
 *
 * @param [explicit] Emoji preference as specified by user.
 */
const getEmoji = (
    explicit = (localStorage.getItem('FUCK_ANIME_LOGGER_EMOJI') || process.env.FUCK_ANIME_LOGGER_EMOJI) as
        | string
        | null
        | undefined,
) => {
    return explicit === 'true' ? true : explicit === 'false' ? false : null;
};

/**
 * Retrieves colors preference from environment or local storage.
 *
 * @param [explicit] Colors preference as specified by user.
 */
const getColors = (
    explicit = (localStorage.getItem('FUCK_ANIME_LOGGER_COLORS') || process.env.FUCK_ANIME_LOGGER_COLORS) as
        | string
        | null
        | undefined,
) => {
    return explicit === 'true' ? true : explicit === 'false' ? false : null;
};

/**
 * Retrieves powerline preference from environment or local storage.
 *
 * @param [explicit] Powerline preference as specified by user.
 */
const getPowerline = (
    explicit = (localStorage.getItem('FUCK_ANIME_LOGGER_POWERLINE') || process.env.FUCK_ANIME_LOGGER_POWERLINE) as
        | string
        | null
        | undefined,
) => {
    return explicit === 'true' ? true : explicit === 'false' ? false : null;
};

/**
 * Retrieves preferred background color from environment or local storage,
 * or guesses it based on theme preference and browser name.
 *
 * @param [option] Background color as specified in plugin options.
 * @param [explicit] Background color as specified by user.
 */
const getBackground = (
    option?: string,
    explicit = (localStorage.getItem('FUCK_ANIME_LOGGER_BACKGROUND') || process.env.FUCK_ANIME_LOGGER_BACKGROUND) as
        | string
        | null
        | undefined,
) => {
    return explicit || option || preferLight.matches
        ? '#ffffff'
        : /firefox/i.test(navigator.userAgent)
        ? '#0c0c0d'
        : '#242424';
};

const color = 'color:';
const bold = 'font-weight:bold;' + color;

/**
 * Returns cached by string hash color, or caches new color and then returns.
 */
const cached1 = (plugin: DevtoolsTransport, string: string) => {
    return plugin.cache1[string] || (plugin.cache1[string] = plugin.hsl(hash(string)));
};

/**
 * Returns cached by level number color, or caches new color and then returns.
 */
const cached2 = (plugin: DevtoolsTransport, number: number) => {
    return plugin.cache2[number] || (plugin.cache2[number] = plugin.hsl(colorCode[number]));
};

/**
 * Prints message without formatting.
 */
const printPlain = (plugin: DevtoolsTransport, message: LogMessage) => {
    plugin.log(
        (plugin.emoji ? emojiCode[message.level] : `[${LogLevel[message.level]}]`) +
            ' ' +
            message.tags.join(' ') +
            ' ' +
            message.namespace +
            (typeof message.payload[0] === 'string' ? (message.payload as unknown[]).shift() : ''),
        ...message.payload,
    );
};

/**
 * Prints message with CSS formatting.
 */
const printCss = (plugin: DevtoolsTransport, { level, tags, namespace, payload }: LogMessage) => {
    const { emoji, powerline, background } = plugin;

    let prefix = '';
    let params = [] as unknown[];
    let tag: string;

    if (emoji) {
        // Use emoji code ↓
        prefix += emojiCode[level];
    } else {
        // Use color code ↓
        prefix += '%c[' + LogLevel[level] + ']';
        params.push(bold + cached2(plugin, level));
    }

    // Reset CSS if it exists and no tags nor namespace exist ↓
    if (!emoji && (!tags.length || !namespace)) {
        prefix += '%c';
        params.push('');
    }

    // Format tags ↓
    for (let i = 0, l = tags.length; i < l; i++) {
        tag = tags[i];
        prefix += ' %c' + tag;
        params.push(color + cached1(plugin, tag));
    }

    // Close tags CSS if no namespace exists ↓
    if (tags.length && !namespace) {
        prefix += '%c';
        params.push('');
    }

    // Format namespace ↓
    if (namespace) {
        if (powerline) {
            const c = cached1(plugin, namespace);

            prefix += ` %c%c ${namespace} %c`;
            params.push(color + background, bold + '#fff;background:' + c, color + c);
        } else {
            prefix += ' %c' + namespace;
            params.push(bold + cached1(plugin, namespace));
        }
    }

    // Close namespace CSS and append specified format string if exists ↓
    if (typeof payload[0] === 'string') {
        prefix += '%c ' + (payload as unknown[]).shift();
        params.push('');
    }

    // Print everything ↓
    plugin.log(prefix, ...params, ...payload);
};
// endregion Internals

/**
 * Devtools/terminal transport options.
 */
export interface ConsoleTransportOptions {
    /**
     * Whether to use emoji code instead of color code.
     *
     * May be overridden by `FUCK_ANIME_LOGGER_EMOJI` environment variable or local storage key.
     *
     * When specified, the `FUCK_ANIME_LOGGER_EMOJI` variable should be either `true` or `false`.
     *
     * @default `false`
     */
    readonly emoji?: boolean;

    /**
     * Whether to use colors.
     *
     * May be overridden by `FUCK_ANIME_LOGGER_COLORS` environment variable or local storage key.
     *
     * When specified, the `FUCK_ANIME_LOGGER_COLORS` variable should be either `true` or `false`.
     *
     * @default `true`
     */
    readonly colors?: boolean;

    /**
     * Whether to use powerline symbols for segments.
     *
     * May be overridden by `FUCK_ANIME_LOGGER_POWERLINE` environment variable or local storage key.
     *
     * When specified, the `FUCK_ANIME_LOGGER_POWERLINE` variable should be either `true` or `false`.
     *
     * @default `false`
     */
    readonly powerline?: boolean;

    /**
     * Background color for initial segment (only takes effect when `powerline` is `true`).
     * Should match devtools’ background.
     *
     * May be overridden by `FUCK_ANIME_LOGGER_BACKGROUND` environment variable or local storage key.
     *
     * When specified, the `FUCK_ANIME_LOGGER_BACKGROUND` variable must be a valid `#rrggbb` color.
     *
     * @default Guessed based on preferred color scheme and browser name.
     */
    readonly background?: string;

    /**
     * Text lightness; used for initial segment, and also for namespace segment
     * when `powerline` is `false`.
     *
     * May be overridden by `FUCK_ANIME_LOGGER_LIGHTNESS` environment variable or local storage key.
     *
     * When specified, the `FUCK_ANIME_LOGGER_LIGHTNESS` variable must be a valid number.
     *
     * @default Guessed based on preferred color scheme.
     */
    readonly lightness?: number;

    /**
     * List of devtools-specific plugins. Only filters and preprocessors supported.
     *
     * @default `[]`
     */
    readonly plugins?: readonly LoggerPlugin[];
}

/**
 * Devtools transport. Prints messages to devtools console.
 *
 * Supports the following configuration options from local storage:
 *
 * 1. `@ripreact/logger:lightness` (number) — preferred text lightness.
 * 2. `@ripreact/logger:emoji` — must contain `'true'` of `'1'` substring to
 *    force enable emoji. Otherwise, if set, force disables emoji. Takes
 *    priority over {@link ConsoleTransportOptions.emoji}.
 *
 * These options will be re-read from local storage on change, so you don’t need
 * to reload page to apply changes.
 */
export class DevtoolsTransport implements LoggerTransport {
    /**
     * List of devtools-specific filter plugins.
     */
    readonly filters: readonly LoggerFilter[];

    /**
     * List of console-specific preprocessor plugins.
     */
    readonly preprocessors: readonly LoggerPreprocessor[];

    /**
     * Whether to use emoji code instead of color code as overridden by user.
     */
    emoji: boolean;

    /**
     * Whether to use colors as overridden by user.
     */
    colors: boolean;

    /**
     * Current lightness value.
     */
    lightness: number;

    /**
     * Whether to use powerline for segments formatting.
     */
    powerline: boolean;

    /**
     * Background color for initial segment (only takes effect when `powerline` is `true`).
     * Should match devtools’ background.
     */
    background: string;

    /**
     * Original `console.log`.
     * Allows to override default `console` or `console.log` after plugin plugin class evaluation.
     */
    readonly log = console.log;

    /**
     * Cache for colors generated by string hash.
     */
    cache1: Record<string, string> = {};

    /**
     * Cache for colors generated by level number.
     */
    cache2: Record<number, string> = {};

    constructor(options = {} as ConsoleTransportOptions) {
        const { colors = true, emoji = false, plugins = [], powerline = false, background, lightness } = options;

        const filters = [] as LoggerFilter[];
        const preprocessors = [] as LoggerPreprocessor[];

        for (let i = 0, l = plugins.length; i < l; i++) {
            const plugin = plugins[i];

            if (plugin.filter) filters.push(plugin as LoggerFilter);
            if (plugin.preprocess) preprocessors.push(plugin as LoggerPreprocessor);
        }

        preferLight.addEventListener('change', () => {
            this.lightness = getLightness(lightness);
            this.cache1 = {};
            this.cache2 = {};
            this.background = getBackground(background)!;
        });

        window.addEventListener('storage', event => {
            switch (event.key) {
                case 'FUCK_ANIME_LOGGER_LIGHTNESS': {
                    this.lightness = getLightness(lightness);
                    this.cache1 = {};
                    this.cache2 = {};

                    break;
                }
                case 'FUCK_ANIME_LOGGER_EMOJI': {
                    this.emoji = getEmoji() ?? emoji;

                    break;
                }
                case 'FUCK_ANIME_LOGGER_COLORS': {
                    this.colors = getColors() ?? colors;

                    break;
                }
                case 'FUCK_ANIME_LOGGER_POWERLINE': {
                    this.powerline = getPowerline() ?? powerline;

                    break;
                }
                case 'FUCK_ANIME_LOGGER_BACKGROUND': {
                    this.background = getBackground(background)!;

                    break;
                }
            }
        });

        this.filters = filters;
        this.preprocessors = preprocessors;
        this.lightness = getLightness(lightness);
        this.emoji = getEmoji() ?? emoji;
        this.colors = getColors() ?? colors;
        this.powerline = getPowerline() ?? powerline;
        this.background = getBackground(background)!;
    }

    /**
     * Internal HSLᵤᵥ wrapper.
     */
    hsl(h: number) {
        return hsl(h, 100, this.lightness);
    }

    transport(message: LogMessage) {
        // Preprocess message with console-specific plugins ↓
        message = applyPlugins(this.filters, this.preprocessors, message)!; // ← Meh.

        // Break, if message was rejected ↓
        if (!message) return;

        if (this.colors) {
            printCss(this, message);
        } else {
            printPlain(this, message);
        }
    }
}
// endregion Devtools transport

// region Namespace preprocessor
/**
 * Either a:
 *
 * 1. `String#replace` arguments.
 * 2. `string -> string` function.
 *
 * Neither `String#replace` arguments nor `string -> string` function should produce empty strings.
 */
export type NamespacePreprocessorOptions =
    | [(s: string) => string]
    | [{ [Symbol.replace](s: string, r: string): string }, string]
    | [{ [Symbol.replace](s: string, r: (...s: any[]) => string): string }, (...s: any[]) => string];

/**
 * Allows to preprocess namespace in different ways:
 *
 * 1. By replacing substrings the same way `String#replace` does.
 * 2. By replacing with `string -> string` function.
 */
export class NamespacePreprocessor implements LoggerPreprocessor {
    /**
     * Atomic namespace preprocessor function.
     */
    readonly replace: (namespace: string) => string;

    constructor(...replace: NamespacePreprocessorOptions) {
        this.replace = typeof replace[0] === 'function' ? replace[0] : ns => ns.replace(...(replace as [any, any]));
    }

    preprocess({ namespace, ...message }: LogMessage) {
        return {
            ...message,
            namespace: normalizeNamespace(this.replace(namespace)),
        };
    }
}
// endregion Namespace preprocessor

// region Tags preprocessor
/**
 * Either a:
 *
 * 1. `String#replace` arguments.
 * 2. `(string, number, string[]) -> string | false | null | undefined | void` function.
 *
 * When a function returns falsy value, the tag will be omitted.
 * When non-empty string is returned, new string will be used as the tag.
 */
export type TagsPreprocessorOptions =
    | NamespacePreprocessorOptions
    | [(t: string, i: number, ts: readonly string[]) => string | false | null | undefined | void];

/**
 * Tags preprocessor plugin. Allows to preprocess plugins in different ways:
 *
 * 1. By replacing substrings in the same way as `String#replace` does.
 * 2. By replacing with `string -> any` function.
 *
 * If a tag was evaluated to non-string value or empty string, it will be omitted.
 */
export class TagsPreprocessor implements LoggerPreprocessor {
    /**
     * Atomic tag preprocessor function.
     */
    readonly replace: (t: string, i: number, ts: readonly string[]) => string | false | null | undefined | void;

    constructor(...replace: TagsPreprocessorOptions) {
        this.replace = typeof replace[0] === 'function' ? replace[0] : ns => ns.replace(...(replace as [any, any]));
    }

    /**
     * Internal `flatMap` callback.
     *
     * @param tag Tag to preprocess.
     * @param index Tag index.
     * @param tags Tags array.
     */
    protected map(tag: string, index: number, tags: readonly string[]) {
        const result = this.replace(tag, index, tags);

        if (!result) return []; // ← Omit non-string values or empty strings.

        return result;
    }

    preprocess({ tags, ...message }: LogMessage) {
        return {
            ...message,
            tags: normalizeTags(tags.flatMap(this.map, this)),
        };
    }
}
// endregion Tags preprocessor

export const logger = new Logger({
    namespace: 'fuck-anime:1488',
    plugins: [
        new LevelFilter(),
        new DevtoolsTransport({
            powerline: true,
            plugins: [new NamespacePreprocessor(/^fuck-anime:1488/, '')],
        }),
    ],
});
