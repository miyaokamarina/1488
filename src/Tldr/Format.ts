import {
    diffDays,
    diffHours,
    diffMinutes,
    diffMonths,
    diffQuarters,
    diffSeconds,
    diffWeeks,
    diffYears,
    isDate,
    Mutable,
    ReadonlyRecord,
} from '../Prelude';

import {
    Calendar,
    Currency,
    TldFormatPartType,
    NativeRelativeTimeUnit,
    NumberingSystem,
    RelativeTimeUnit,
    Unit,
} from './402';

import { TranslationMessageStatic } from './Tldr';

// region Internal
/**
 * Time differences table.
 */
type TimeDiffs = ReadonlyRecord<NativeRelativeTimeUnit, number>;

/**
 * String format dummy object.
 */
const StringFormat = {
    format: (string: string) => string,
    formatToParts: (string: string) => [{ type: 'string', value: string }],
};

/**
 * Stub to avoid errors while formatting other types.
 */
const OtherFormat = {
    format: () => '',
    formatToParts: () => [],
};

/**
 * Creates time differences table.
 *
 * @param value Current time.
 * @param origin Origin time.
 */
const createDiffs = (value: Date, origin: Date): TimeDiffs => ({
    year: diffYears(value, origin),
    quarter: diffQuarters(value, origin),
    month: diffMonths(value, origin),
    week: diffWeeks(value, origin),
    day: diffDays(value, origin),
    hour: diffHours(value, origin),
    minute: diffMinutes(value, origin),
    second: diffSeconds(value, origin),
});

/**
 * Checks if dates difference is out of relative time bounds. Out-of-bounds
 * dates will be formatted as absolute values.
 *
 * @param sign Dates difference sign.
 * @param diffs Differences record.
 * @param options Resolved options.
 */
const isOutOfBounds = <M>(sign: number, diffs: TimeDiffs, options: FormatOptions<M>) => {
    const { upperUnit, upperValue, lowerUnit, lowerValue } = options;

    if (sign > 0) {
        return diffs[upperUnit!] >= upperValue!;
    } else if (sign <= 0) {
        return diffs[lowerUnit!] <= lowerValue!;
    }

    return false;
};

/**
 * Selects first non-zero difference (from largest unit to smallest, except
 * quarters) and returns it and matching unit.
 *
 * @param diffs Date differences record.
 */
const selectRelativeUnit = (diffs: TimeDiffs) => {
    const entries = Object.entries(diffs);
    let entry: readonly [NativeRelativeTimeUnit, number];
    let unit: NativeRelativeTimeUnit;
    let diff: number;
    let i = 0;
    const l = entries.length;

    for (; i < l; i++) {
        entry = entries[i] as any;
        unit = entry[0];
        diff = entry[1];

        if (unit != 'quarter' && diff) {
            return [diff, unit] as const;
        }
    }

    return [0, 'day'] as const;
};

/**
 * Normalizes options of any allowed type to well-formed record options.
 *
 * @param options Options to normalize.
 */
const normalizeOptions = <M>(options?: FormatOptions<M> | null) => {
    options = options || {};

    options = { ...options };

    const { unit, maximumValue, maximumUnit } = options;

    // Imply `style: 'currency'` if currency specified ↓
    if (options.currency) (options as Mutable<FormatOptions<M>>).number = 'currency';

    // Imply `style: 'unit'` if currency specified ↓
    if (options.unit) (options as Mutable<FormatOptions<M>>).number = 'unit';

    // Imply `origin: new Date()` if relative time unit specified ↓
    if (unit) (options as Mutable<FormatOptions<M>>).origin = options.origin || new Date();

    return {
        localeMatcher: 'best fit',
        unit: 'auto',

        ...options,

        upperValue: unit ? Infinity : Math.max(options.upperValue!, maximumValue!, 0),
        upperUnit: options.upperUnit || maximumUnit || 'day',
        lowerValue: unit ? -Infinity : Math.min(options.lowerValue!, -maximumValue!, 0),
        lowerUnit: options.lowerUnit || maximumUnit || 'day',
    } as FormatOptions<M>;
};

/**
 * Selects a value from a table.
 *
 * @param table Table to select from.
 */
function select(this: Formatted<any>, table: FormatTable<any>) {
    const raw = this.raw;
    const locale = this.locale;
    const options = this.options;

    if (typeof raw !== 'number' && typeof raw !== 'string') return table.other;

    return (
        table[raw] ??
        table[new Intl.PluralRules(locale, options as FormatOptions<any>).select(raw as any)] ??
        table.other
    );
}

/**
 * Updates formatted value.
 *
 * @param value New value to format using old options.
 */
function update(this: Formatted<any>, value: any) {
    return (this.format as any)(this.locale, value, this.options);
}

/**
 * Updates format options.
 *
 * @param options New options to format old value.
 */
function configure(this: Formatted<any>, options: FormatOptions<any>) {
    return (this.format as any)(this.locale, this.raw, normalizeOptions(options));
}
// endregion Internal

// region Types
/**
 * Unified format options.
 */
export interface FormatOptions<M> {
    /**
     * Locale matching algorithm.
     */
    readonly localeMatcher?: 'lookup' | 'best fit';

    /**
     * Postprocessing function.
     */
    readonly transform?: (string: string, parts: readonly FormatPart[], locale: string) => TranslationMessageStatic<M>;

    /**
     * Numbering system to use.
     */
    readonly numberingSystem?: NumberingSystem;

    /**
     * Whether to use grouping separators.
     */
    readonly useGrouping?: boolean;

    /**
     * The formatting style to use:
     *
     * -   `'currency'` — for currency formatting.
     * -   `'decimal'` (default) — for plain number formatting.
     * -   `'percent'` — for percent formatting.
     *
     * Corresponding `Intl.NumberFormat` option is `style`.
     */
    readonly number?: 'currency' | 'decimal' | 'percent' | 'unit';

    /**
     * The currency to use in currency formatting.
     */
    readonly currency?: Currency;

    /**
     * How to display the currency in currency formatting:
     *
     * -   `'symbol'` (default) — use a localized currency symbol.
     * -   `'code'` — use the ISO currency code.
     * -   `'code'` — use a localized currency name.
     *
     * TODO: `narrowSymbol` example.
     */
    readonly currencyDisplay?: 'narrowSymbol' | 'symbol' | 'code' | 'name';

    /**
     * The unit to use in unit formatting.
     */
    readonly unit?: Unit;

    /**
     * Unit display style.
     *
     * // TODO: Examples.
     */
    readonly unitDisplay?: 'narrow' | 'short' | 'long';

    /**
     * Notation style.
     *
     * // TODO: Examples.
     */
    readonly notation?: 'standard' | 'scientific' | 'engineering' | 'compact';

    /**
     * Compact display style.
     *
     * // TODO: Examples.
     */
    readonly compactDisplay?: 'short' | 'long';

    /**
     * Sign display style.
     *
     * // TODO: Examples.
     */
    readonly signDisplay?: 'auto' | 'always' | 'never' | 'exceptZero';

    /**
     * Currency sign style.
     *
     * // TODO: Examples.
     */
    readonly currencySign?: 'standard' | 'accounting';

    // TODO: `readonly unitConvert?: boolean`.
    // TODO: `readonly round?: (value: number) => number;`.

    /**
     * The minimum number of integer digits to use. Possible values are from 1
     * to 21; the default is 1.
     */
    readonly minimumIntegerDigits?: number;

    /**
     * The minimum number of fraction digits to use. Possible values are from 0
     * to 20; the default for plain number and percent formatting is 0; the
     * default for currency formatting is the number of minor unit digits
     * provided by the ISO 4217 currency code list (2 if the list doesn’t
     * provide that information).
     */
    readonly minimumFractionDigits?: number;

    /**
     * The maximum number of fraction digits to use. Possible values are from 0
     * to 20; the default for plain number formatting is the larger of
     * `minimumFractionDigits` and 3; the default for currency formatting is the
     * larger of `minimumFractionDigits` and the number of minor unit digits
     * provided by the ISO 4217 currency code list (2 if the list doesn’t
     * provide that information); the default for percent formatting is the
     * larger of `minimumFractionDigits` and 0.
     */
    readonly maximumFractionDigits?: number;

    /**
     * The minimum number of significant digits to use. Possible values are from
     * 1 to 21; the default is 1.
     */
    readonly minimumSignificantDigits?: number;

    /**
     * The maximum number of significant digits to use. Possible values are from
     * 1 to 21; the default is 21.
     */
    readonly maximumSignificantDigits?: number;

    /**
     * Plural rules type to use. Possible values are:
     *
     * -   `'cardinal'` (default) — for cardinal numbers (referring to the
     *     quantity of things).
     * -   `'ordinal'` — for ordinal number (referring to the ordering or
     *     ranking of things, e.g. “1st”, “2nd”, “3rd” in English).
     */
    readonly plural?: 'cardinal' | 'ordinal';

    /**
     * The format matching algorithm to use.
     */
    readonly formatMatcher?: 'basic' | 'best fit';

    /**
     * Calendar to use.
     */
    readonly calendar?: Calendar;

    /**
     * Whether to use 12-hour time. This option overrides the `hc` language tag
     * and/or the `hourCycle` option in case both are present.
     */
    readonly hour12?: boolean;

    /**
     * The hour cycle to use.
     */
    readonly hourCycle?: 'hc11' | 'hc12' | 'hc23' | 'hc24';

    /**
     * The time zone to use. The only value implementations must recognize is
     * `'UTC'`; the default is the runtime’s default time zone. Implementations
     * may also recognize the time zone names of the IANA time zone database,
     * such as `'Asia/Shanghai'`, `'Asia/Kolkata'`, `'America/New_York'`.
     */
    readonly timeZone?: string;

    /**
     * The representation of the second.
     */
    readonly second?: '2-digit' | 'numeric';

    /**
     * The representation of the minute.
     */
    readonly minute?: '2-digit' | 'numeric';

    /**
     * The representation of the hour.
     */
    readonly hour?: '2-digit' | 'numeric';

    /**
     * The representation of the day.
     */
    readonly day?: '2-digit' | 'numeric';

    /**
     * The representation of the weekday. Possible values are:
     *
     * -   `'narrow'` — e.g. `'T'`) Two weekdays may have the same narrow style
     *     for some locales (e.g. Tuesday’s narrow style is also `'T'`).
     * -   `'short'` — e.g. `'Thu'`.
     * -   `'long'` — e.g. `'Thursday'`.
     */
    readonly weekday?: 'narrow' | 'short' | 'long';

    /**
     * The representation of the month. Possible values are:
     *
     * -   `'narrow'` — e.g. `'M'`. Two months may have the same narrow style
     *     for some locales (e.g. May’s narrow style is also `'M'`).
     * -   `'short'` — e.g. `'Mar'`.
     * -   `'long'` — e.g. `'March'`.
     * -   `'2-digit'` — e.g. `'03'`.
     * -   `'numeric'` — e.g. `'3'`.
     */
    readonly month?: 'narrow' | 'short' | 'long' | '2-digit' | 'numeric';

    /**
     * The representation of the year.
     */
    readonly year?: '2-digit' | 'numeric';

    /**
     * The representation of the era. Possible values are:
     *
     * -   `'narrow'` — e.g. `'A'`.
     * -   `'short'` — e.g. `'AD'`.
     * -   `'long'` — e.g. `'Anno Domini'`.
     */
    readonly era?: 'narrow' | 'short' | 'long';

    /**
     * The representation of the time zone name. Possible values are:
     *
     * `'long'` — e.g. `'Moscow Standard Time'`.
     * `'short'` — e.g. `'GMT+3'`.
     */
    readonly timeZoneName?: 'short' | 'long';

    /**
     * The time formatting style to use. Each style is an alias to set of other
     * options:
     *
     * -   `'short'` — `minute: 'numeric', hour: 'numeric'`.
     * -   `'medium'` — `...short, second: 'numeric'`.
     * -   `'long'` — `...medium, timeZoneName: 'short'`.
     * -   `'full'` — `...long, timeZoneName: 'long'`.
     */
    readonly timeStyle?: 'short' | 'medium' | 'long' | 'full';

    /**
     * The date formatting style to use. Each style is as alias to set of other
     * options:
     *
     * -   `'short'` — `day: 'numeric', month: 'numeric', year: 'numeric'`.
     * -   `'medium'` — `...short, month: 'short'`.
     * -   `'long'` — `...medium, month: 'long'`.
     * -   `'full'` — `...long, weekday: 'long', era: 'long'`.
     */
    readonly dateStyle?: 'short' | 'medium' | 'long' | 'full';

    /**
     * The format of relative time message. Possible values are:
     *
     * `'always'` (default) — e.g. `'1 day ago'`.
     * `'auto'` — e.g. `'yesterday'`.
     */
    readonly numeric?: 'always' | 'auto';

    /**
     * The length of the relative time message. Possible values are:
     *
     * -   `'narrow'` — e.g. `'in 1 mo.'`. The narrow style could be similar to
     *     the short style for some locales.
     * -   `'short'` — e.g. `'in 1 mo.'`.
     * -   `'long'` (default) — e.g. `'in 1 month'`.
     *
     * Corresponding `Intl.RelativeTimeFormat` options is `style`.
     */
    readonly relativeTimeDisplay?: 'narrow' | 'short' | 'long';

    /**
     * Relative time unit. If `'auto'` specified, formatter will select largest
     * unit with non-zero difference.
     */
    readonly relativeTimeUnit?: RelativeTimeUnit;

    /**
     * Maximum difference absolute value to format as relative time; if
     * difference is larger, datetime will be formatted as absolute datetime.
     */
    readonly maximumValue?: number;

    /**
     * Unit to use with `maximumValue`.
     */
    readonly maximumUnit?: NativeRelativeTimeUnit;

    /**
     * Maximum difference value for future dates to format as relative time.
     * Defaults to `Infinity` if `unit` . If both `upperValue` and
     * `maximumValue` specified, an option with largest absolute value wins.
     * Otherwise defaults to `maximumValue` or `0`.
     */
    readonly upperValue?: number;

    /**
     * Unit to use with `upperValue`. Defaults to `maximumUnit` ot `'day'`.
     */
    readonly upperUnit?: NativeRelativeTimeUnit;

    /**
     * Same as `upperValue`, but for past dates.
     */
    readonly lowerValue?: number;

    /**
     * Same as `upperUnit`, but for past dates.
     */
    readonly lowerUnit?: NativeRelativeTimeUnit;

    /**
     * Origin datetime for formatting relative values.
     */
    readonly origin?: Date;
}

/**
 * Selection table.
 */
export interface FormatTable<M> {
    readonly zero?: TranslationMessageStatic<M>;
    readonly one?: TranslationMessageStatic<M>;
    readonly two?: TranslationMessageStatic<M>;
    readonly few?: TranslationMessageStatic<M>;
    readonly many?: TranslationMessageStatic<M>;
    readonly other: TranslationMessageStatic<M>;
    readonly [match: string]: TranslationMessageStatic<M>;
    readonly [match: number]: TranslationMessageStatic<M>;
}

/**
 * Token of formatted string.
 */
export interface FormatPart {
    readonly type: TldFormatPartType;
    readonly value: string;
}

/**
 * Formatted value wrapper type.
 */
export type Formatted<M> = readonly [TranslationMessageStatic<M>] & {
    /**
     * Original raw value.
     */
    readonly raw: unknown;

    /**
     * Target locale.
     */
    readonly locale: string;

    /**
     * Normalized options.
     */
    readonly options: FormatOptions<M>;

    /**
     * Updates value.
     *
     * > **NB:** This method is not bound, so don’t use it detached.
     *
     * @param value New value. Should have the same type as {@link Formatted.raw}.
     */
    readonly update: (value: unknown) => Formatted<M>;

    /**
     * Updates options.
     *
     * > **NB:** This method is not bound, so don’t use it detached.
     *
     * @param options New options.
     */
    readonly configure: (options?: FormatOptions<M>) => Formatted<M>;

    /**
     * Returns numeric value.
     */
    readonly number: number;

    /**
     * Returns string value.
     */
    readonly string: string;

    /**
     * Returns date value.
     */
    readonly date: Date;

    /**
     * Selects a value from a table.
     *
     * > **NB:** This method is not bound, so don’t use it detached.
     *
     * @param table A table to select from.
     */
    readonly select: (table: FormatTable<M>) => TranslationMessageStatic<M>;

    /**
     * Internal function used by {@link Formatted.update} and {@link Formatted.configure}. Don’t use it directly.
     *
     * @deprecated
     */
    readonly format: unknown;
};
// endregion Types

// region Format
/**
 * Creates formatted value wrapper.
 *
 * @param locale Target locale.
 * @param raw A value to format.
 * @param options Normalized options.
 */
export const format = <M>(locale: string, raw: unknown, options?: FormatOptions<M> | null): Formatted<M> => {
    options = normalizeOptions(options);

    const { origin, transform, relativeTimeUnit } = options;

    let result: TranslationMessageStatic<M>;
    let diffs: TimeDiffs;
    let value = [raw] as readonly any[];
    let format: any;
    let number: number;
    let string: string;

    if (typeof raw === 'number') {
        format = new Intl.NumberFormat(locale, { ...options, style: options.number });
    } else if (typeof raw === 'string') {
        format = StringFormat;
    } else if (isDate(raw)) {
        if (!origin) {
            format = new Intl.DateTimeFormat(locale, options);
        } else {
            diffs = createDiffs(raw, origin);

            if (isOutOfBounds((raw as any) - (origin as any), diffs, options)) {
                format = new Intl.DateTimeFormat(locale, options);
            } else {
                // TODO: Remove `as any`.
                format = new (Intl as any).RelativeTimeFormat(locale, {
                    ...options,
                    style: options.relativeTimeDisplay,
                });

                value =
                    relativeTimeUnit == 'auto'
                        ? selectRelativeUnit(diffs)
                        : ([diffs[relativeTimeUnit!], relativeTimeUnit!] as const);
            }
        }
    } else {
        format = OtherFormat;
    }

    number = Number(raw);
    string = String(raw);

    result = format.format(...value);

    if (transform) result = transform(result as string, format.formatToParts(...value), locale);

    return Object.assign([result] as any, {
        raw,
        locale,
        options,
        format,

        update,
        configure,

        number,
        string,
        date: new Date(number),
        select,
    });
};
// endregion Format
