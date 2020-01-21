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
} from './Date';
import { Mutable, ReadonlyRecord } from './Etc';
import { MessageStatic } from './Translate';

// region Internal
/**
 * Time differences table.
 */
type TimeDiffs = ReadonlyRecord<NativeRelativeTimeUnit, number>;

// noinspection JSUnusedGlobalSymbols
/**
 * String format dummy object.
 */
const StringFormat = {
    format: (string: string) => string,
    formatToParts: (string: string) => [{ type: 'string', value: string }],
};

// noinspection JSUnusedGlobalSymbols
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
 * @param value
 * @param origin
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

function select(this: Formatted<any>, { other, ...rest }: FormatTable<any>) {
    const raw = this.raw;
    const locale = this.locale;
    const options = this.options;

    if (typeof raw !== 'number' && typeof raw !== 'string') return other;

    return rest[raw] || rest[new Intl.PluralRules(locale, options as FormatOptions<any>).select(raw as any)] || other;
}

function toString(this: Formatted<any>) {
    return this.result;
}

function update(this: Formatted<any>, value: any) {
    return (this.format as any)(this.locale, value, this.options);
}

function configure(this: Formatted<any>, options: FormatOptions<any>) {
    return (this.format as any)(this.locale, this.raw, normalizeOptions(options));
}
// endregion Internal

// region Types
/**
 * Allowed currencies.
 */
// prettier-ignore
export type Currency =
    | 'AED' | 'AFN' | 'ALL' | 'AMD' | 'ANG' | 'AOA' | 'ARS' | 'AUD' | 'AWG' | 'AZN' | 'BAM' | 'BBD' | 'BDT' | 'BGN'
    | 'BHD' | 'BIF' | 'BMD' | 'BND' | 'BOB' | 'BOV' | 'BRL' | 'BSD' | 'BTN' | 'BWP' | 'BYN' | 'BZD' | 'CAD' | 'CDF'
    | 'CHE' | 'CHF' | 'CHW' | 'CLF' | 'CLP' | 'CNY' | 'COP' | 'COU' | 'CRC' | 'CUC' | 'CUP' | 'CVE' | 'CZK' | 'DJF'
    | 'DKK' | 'DOP' | 'DZD' | 'EGP' | 'ERN' | 'ETB' | 'EUR' | 'FJD' | 'FKP' | 'GBP' | 'GEL' | 'GHS' | 'GIP' | 'GMD'
    | 'GNF' | 'GTQ' | 'GYD' | 'HKD' | 'HNL' | 'HRK' | 'HTG' | 'HUF' | 'IDR' | 'ILS' | 'INR' | 'IQD' | 'IRR' | 'ISK'
    | 'JMD' | 'JOD' | 'JPY' | 'KES' | 'KGS' | 'KHR' | 'KMF' | 'KPW' | 'KRW' | 'KWD' | 'KYD' | 'KZT' | 'LAK' | 'LBP'
    | 'LKR' | 'LRD' | 'LSL' | 'LYD' | 'MAD' | 'MDL' | 'MGA' | 'MKD' | 'MMK' | 'MNT' | 'MOP' | 'MRU' | 'MUR' | 'MVR'
    | 'MWK' | 'MXN' | 'MXV' | 'MYR' | 'MZN' | 'NAD' | 'NGN' | 'NIO' | 'NOK' | 'NPR' | 'NZD' | 'OMR' | 'PAB' | 'PEN'
    | 'PGK' | 'PHP' | 'PKR' | 'PLN' | 'PYG' | 'QAR' | 'RON' | 'RSD' | 'RUB' | 'RWF' | 'SAR' | 'SBD' | 'SCR' | 'SDG'
    | 'SEK' | 'SGD' | 'SHP' | 'SLL' | 'SOS' | 'SRD' | 'SSP' | 'STN' | 'SVC' | 'SYP' | 'SZL' | 'THB' | 'TJS' | 'TMT'
    | 'TND' | 'TOP' | 'TRY' | 'TTD' | 'TWD' | 'TZS' | 'UAH' | 'UGX' | 'USD' | 'USN' | 'UYI' | 'UYU' | 'UYW' | 'UZS'
    | 'VES' | 'VND' | 'VUV' | 'WST' | 'XAF' | 'XAG' | 'XAU' | 'XBA' | 'XBB' | 'XBC' | 'XBD' | 'XCD' | 'XDR' | 'XOF'
    | 'XPD' | 'XPF' | 'XPT' | 'XSU' | 'XTS' | 'XUA' | 'XXX' | 'YER' | 'ZAR' | 'ZMW' | 'ZWL';

/**
 * Possible numbering systems.
 */
// prettier-ignore
export type NumberingSystem =
    | 'arab' | 'arabext' | 'bali' | 'beng' | 'deva' | 'fullwide' | 'gujr' | 'guru'    | 'hanidec' | 'khmr' | 'knda'
    | 'laoo' | 'latn'    | 'limb' | 'mlym' | 'mong' | 'mymr'     | 'orya' | 'tamldec' | 'telu'    | 'thai' | 'tibt';

/**
 * Possible calendars.
 */
// prettier-ignore
export type Calendar =
    | 'buddhist' | 'chinese'  | 'coptic'  | 'ethiopia' | 'ethiopic' | 'gregory' | 'hebrew' | 'indian' | 'islamic'
    | 'iso8601'  | 'japanese' | 'persian' | 'roc';

/**
 * Possible units.
 */
// prettier-ignore
export type Unit =
    | 'acre' | 'bit' | 'byte' | 'celsius' | 'centimeter' | 'day' | 'degree' | 'fahrenheit' | 'fluid-ounce' | 'foot'
    | 'gallon' | 'gigabit' | 'gigabyte' | 'gram' | 'hectare' | 'hour' | 'inch' | 'kilobit' | 'kilobyte' | 'kilogram'
    | 'kilometer' | 'liter' | 'megabit' | 'megabyte' | 'meter' | 'mile' | 'mile-scandinavian' | 'millimeter'
    | 'milliliter' | 'millisecond' | 'minute' | 'month' | 'ounce' | 'percent' | 'petabyte' | 'pound' | 'second'
    | 'stone' | 'terabit' | 'terabyte' | 'week' | 'yard' | 'year' | 'acre-per-acre' | 'acre-per-bit' | 'acre-per-byte'
    | 'acre-per-celsius' | 'acre-per-centimeter' | 'acre-per-day' | 'acre-per-degree' | 'acre-per-fahrenheit'
    | 'acre-per-fluid-ounce' | 'acre-per-foot' | 'acre-per-gallon' | 'acre-per-gigabit' | 'acre-per-gigabyte'
    | 'acre-per-gram' | 'acre-per-hectare' | 'acre-per-hour' | 'acre-per-inch' | 'acre-per-kilobit'
    | 'acre-per-kilobyte' | 'acre-per-kilogram' | 'acre-per-kilometer' | 'acre-per-liter' | 'acre-per-megabit'
    | 'acre-per-megabyte' | 'acre-per-meter' | 'acre-per-mile' | 'acre-per-mile-scandinavian' | 'acre-per-millimeter'
    | 'acre-per-milliliter' | 'acre-per-millisecond' | 'acre-per-minute' | 'acre-per-month' | 'acre-per-ounce'
    | 'acre-per-percent' | 'acre-per-petabyte' | 'acre-per-pound' | 'acre-per-second' | 'acre-per-stone'
    | 'acre-per-terabit' | 'acre-per-terabyte' | 'acre-per-week' | 'acre-per-yard' | 'acre-per-year' | 'bit-per-acre'
    | 'bit-per-bit' | 'bit-per-byte' | 'bit-per-celsius' | 'bit-per-centimeter' | 'bit-per-day' | 'bit-per-degree'
    | 'bit-per-fahrenheit' | 'bit-per-fluid-ounce' | 'bit-per-foot' | 'bit-per-gallon' | 'bit-per-gigabit'
    | 'bit-per-gigabyte' | 'bit-per-gram' | 'bit-per-hectare' | 'bit-per-hour' | 'bit-per-inch' | 'bit-per-kilobit'
    | 'bit-per-kilobyte' | 'bit-per-kilogram' | 'bit-per-kilometer' | 'bit-per-liter' | 'bit-per-megabit'
    | 'bit-per-megabyte' | 'bit-per-meter' | 'bit-per-mile' | 'bit-per-mile-scandinavian' | 'bit-per-millimeter'
    | 'bit-per-milliliter' | 'bit-per-millisecond' | 'bit-per-minute' | 'bit-per-month' | 'bit-per-ounce'
    | 'bit-per-percent' | 'bit-per-petabyte' | 'bit-per-pound' | 'bit-per-second' | 'bit-per-stone' | 'bit-per-terabit'
    | 'bit-per-terabyte' | 'bit-per-week' | 'bit-per-yard' | 'bit-per-year' | 'byte-per-acre' | 'byte-per-bit'
    | 'byte-per-byte' | 'byte-per-celsius' | 'byte-per-centimeter' | 'byte-per-day' | 'byte-per-degree'
    | 'byte-per-fahrenheit' | 'byte-per-fluid-ounce' | 'byte-per-foot' | 'byte-per-gallon' | 'byte-per-gigabit'
    | 'byte-per-gigabyte' | 'byte-per-gram' | 'byte-per-hectare' | 'byte-per-hour' | 'byte-per-inch'
    | 'byte-per-kilobit' | 'byte-per-kilobyte' | 'byte-per-kilogram' | 'byte-per-kilometer' | 'byte-per-liter'
    | 'byte-per-megabit' | 'byte-per-megabyte' | 'byte-per-meter' | 'byte-per-mile' | 'byte-per-mile-scandinavian'
    | 'byte-per-millimeter' | 'byte-per-milliliter' | 'byte-per-millisecond' | 'byte-per-minute' | 'byte-per-month'
    | 'byte-per-ounce' | 'byte-per-percent' | 'byte-per-petabyte' | 'byte-per-pound' | 'byte-per-second'
    | 'byte-per-stone' | 'byte-per-terabit' | 'byte-per-terabyte' | 'byte-per-week' | 'byte-per-yard' | 'byte-per-year'
    | 'celsius-per-acre' | 'celsius-per-bit' | 'celsius-per-byte' | 'celsius-per-celsius' | 'celsius-per-centimeter'
    | 'celsius-per-day' | 'celsius-per-degree' | 'celsius-per-fahrenheit' | 'celsius-per-fluid-ounce'
    | 'celsius-per-foot' | 'celsius-per-gallon' | 'celsius-per-gigabit' | 'celsius-per-gigabyte' | 'celsius-per-gram'
    | 'celsius-per-hectare' | 'celsius-per-hour' | 'celsius-per-inch' | 'celsius-per-kilobit' | 'celsius-per-kilobyte'
    | 'celsius-per-kilogram' | 'celsius-per-kilometer' | 'celsius-per-liter' | 'celsius-per-megabit'
    | 'celsius-per-megabyte' | 'celsius-per-meter' | 'celsius-per-mile' | 'celsius-per-mile-scandinavian'
    | 'celsius-per-millimeter' | 'celsius-per-milliliter' | 'celsius-per-millisecond' | 'celsius-per-minute'
    | 'celsius-per-month' | 'celsius-per-ounce' | 'celsius-per-percent' | 'celsius-per-petabyte' | 'celsius-per-pound'
    | 'celsius-per-second' | 'celsius-per-stone' | 'celsius-per-terabit' | 'celsius-per-terabyte' | 'celsius-per-week'
    | 'celsius-per-yard' | 'celsius-per-year' | 'centimeter-per-acre' | 'centimeter-per-bit' | 'centimeter-per-byte'
    | 'centimeter-per-celsius' | 'centimeter-per-centimeter' | 'centimeter-per-day' | 'centimeter-per-degree'
    | 'centimeter-per-fahrenheit' | 'centimeter-per-fluid-ounce' | 'centimeter-per-foot' | 'centimeter-per-gallon'
    | 'centimeter-per-gigabit' | 'centimeter-per-gigabyte' | 'centimeter-per-gram' | 'centimeter-per-hectare'
    | 'centimeter-per-hour' | 'centimeter-per-inch' | 'centimeter-per-kilobit' | 'centimeter-per-kilobyte'
    | 'centimeter-per-kilogram' | 'centimeter-per-kilometer' | 'centimeter-per-liter' | 'centimeter-per-megabit'
    | 'centimeter-per-megabyte' | 'centimeter-per-meter' | 'centimeter-per-mile' | 'centimeter-per-mile-scandinavian'
    | 'centimeter-per-millimeter' | 'centimeter-per-milliliter' | 'centimeter-per-millisecond' | 'centimeter-per-minute'
    | 'centimeter-per-month' | 'centimeter-per-ounce' | 'centimeter-per-percent' | 'centimeter-per-petabyte'
    | 'centimeter-per-pound' | 'centimeter-per-second' | 'centimeter-per-stone' | 'centimeter-per-terabit'
    | 'centimeter-per-terabyte' | 'centimeter-per-week' | 'centimeter-per-yard' | 'centimeter-per-year' | 'day-per-acre'
    | 'day-per-bit' | 'day-per-byte' | 'day-per-celsius' | 'day-per-centimeter' | 'day-per-day' | 'day-per-degree'
    | 'day-per-fahrenheit' | 'day-per-fluid-ounce' | 'day-per-foot' | 'day-per-gallon' | 'day-per-gigabit'
    | 'day-per-gigabyte' | 'day-per-gram' | 'day-per-hectare' | 'day-per-hour' | 'day-per-inch' | 'day-per-kilobit'
    | 'day-per-kilobyte' | 'day-per-kilogram' | 'day-per-kilometer' | 'day-per-liter' | 'day-per-megabit'
    | 'day-per-megabyte' | 'day-per-meter' | 'day-per-mile' | 'day-per-mile-scandinavian' | 'day-per-millimeter'
    | 'day-per-milliliter' | 'day-per-millisecond' | 'day-per-minute' | 'day-per-month' | 'day-per-ounce'
    | 'day-per-percent' | 'day-per-petabyte' | 'day-per-pound' | 'day-per-second' | 'day-per-stone' | 'day-per-terabit'
    | 'day-per-terabyte' | 'day-per-week' | 'day-per-yard' | 'day-per-year' | 'degree-per-acre' | 'degree-per-bit'
    | 'degree-per-byte' | 'degree-per-celsius' | 'degree-per-centimeter' | 'degree-per-day' | 'degree-per-degree'
    | 'degree-per-fahrenheit' | 'degree-per-fluid-ounce' | 'degree-per-foot' | 'degree-per-gallon'
    | 'degree-per-gigabit' | 'degree-per-gigabyte' | 'degree-per-gram' | 'degree-per-hectare' | 'degree-per-hour'
    | 'degree-per-inch' | 'degree-per-kilobit' | 'degree-per-kilobyte' | 'degree-per-kilogram' | 'degree-per-kilometer'
    | 'degree-per-liter' | 'degree-per-megabit' | 'degree-per-megabyte' | 'degree-per-meter' | 'degree-per-mile'
    | 'degree-per-mile-scandinavian' | 'degree-per-millimeter' | 'degree-per-milliliter' | 'degree-per-millisecond'
    | 'degree-per-minute' | 'degree-per-month' | 'degree-per-ounce' | 'degree-per-percent' | 'degree-per-petabyte'
    | 'degree-per-pound' | 'degree-per-second' | 'degree-per-stone' | 'degree-per-terabit' | 'degree-per-terabyte'
    | 'degree-per-week' | 'degree-per-yard' | 'degree-per-year' | 'fahrenheit-per-acre' | 'fahrenheit-per-bit'
    | 'fahrenheit-per-byte' | 'fahrenheit-per-celsius' | 'fahrenheit-per-centimeter' | 'fahrenheit-per-day'
    | 'fahrenheit-per-degree' | 'fahrenheit-per-fahrenheit' | 'fahrenheit-per-fluid-ounce' | 'fahrenheit-per-foot'
    | 'fahrenheit-per-gallon' | 'fahrenheit-per-gigabit' | 'fahrenheit-per-gigabyte' | 'fahrenheit-per-gram'
    | 'fahrenheit-per-hectare' | 'fahrenheit-per-hour' | 'fahrenheit-per-inch' | 'fahrenheit-per-kilobit'
    | 'fahrenheit-per-kilobyte' | 'fahrenheit-per-kilogram' | 'fahrenheit-per-kilometer' | 'fahrenheit-per-liter'
    | 'fahrenheit-per-megabit' | 'fahrenheit-per-megabyte' | 'fahrenheit-per-meter' | 'fahrenheit-per-mile'
    | 'fahrenheit-per-mile-scandinavian' | 'fahrenheit-per-millimeter' | 'fahrenheit-per-milliliter'
    | 'fahrenheit-per-millisecond' | 'fahrenheit-per-minute' | 'fahrenheit-per-month' | 'fahrenheit-per-ounce'
    | 'fahrenheit-per-percent' | 'fahrenheit-per-petabyte' | 'fahrenheit-per-pound' | 'fahrenheit-per-second'
    | 'fahrenheit-per-stone' | 'fahrenheit-per-terabit' | 'fahrenheit-per-terabyte' | 'fahrenheit-per-week'
    | 'fahrenheit-per-yard' | 'fahrenheit-per-year' | 'fluid-ounce-per-acre' | 'fluid-ounce-per-bit'
    | 'fluid-ounce-per-byte' | 'fluid-ounce-per-celsius' | 'fluid-ounce-per-centimeter' | 'fluid-ounce-per-day'
    | 'fluid-ounce-per-degree' | 'fluid-ounce-per-fahrenheit' | 'fluid-ounce-per-fluid-ounce' | 'fluid-ounce-per-foot'
    | 'fluid-ounce-per-gallon' | 'fluid-ounce-per-gigabit' | 'fluid-ounce-per-gigabyte' | 'fluid-ounce-per-gram'
    | 'fluid-ounce-per-hectare' | 'fluid-ounce-per-hour' | 'fluid-ounce-per-inch' | 'fluid-ounce-per-kilobit'
    | 'fluid-ounce-per-kilobyte' | 'fluid-ounce-per-kilogram' | 'fluid-ounce-per-kilometer' | 'fluid-ounce-per-liter'
    | 'fluid-ounce-per-megabit' | 'fluid-ounce-per-megabyte' | 'fluid-ounce-per-meter' | 'fluid-ounce-per-mile'
    | 'fluid-ounce-per-mile-scandinavian' | 'fluid-ounce-per-millimeter' | 'fluid-ounce-per-milliliter'
    | 'fluid-ounce-per-millisecond' | 'fluid-ounce-per-minute' | 'fluid-ounce-per-month' | 'fluid-ounce-per-ounce'
    | 'fluid-ounce-per-percent' | 'fluid-ounce-per-petabyte' | 'fluid-ounce-per-pound' | 'fluid-ounce-per-second'
    | 'fluid-ounce-per-stone' | 'fluid-ounce-per-terabit' | 'fluid-ounce-per-terabyte' | 'fluid-ounce-per-week'
    | 'fluid-ounce-per-yard' | 'fluid-ounce-per-year' | 'foot-per-acre' | 'foot-per-bit' | 'foot-per-byte'
    | 'foot-per-celsius' | 'foot-per-centimeter' | 'foot-per-day' | 'foot-per-degree' | 'foot-per-fahrenheit'
    | 'foot-per-fluid-ounce' | 'foot-per-foot' | 'foot-per-gallon' | 'foot-per-gigabit' | 'foot-per-gigabyte'
    | 'foot-per-gram' | 'foot-per-hectare' | 'foot-per-hour' | 'foot-per-inch' | 'foot-per-kilobit'
    | 'foot-per-kilobyte' | 'foot-per-kilogram' | 'foot-per-kilometer' | 'foot-per-liter' | 'foot-per-megabit'
    | 'foot-per-megabyte' | 'foot-per-meter' | 'foot-per-mile' | 'foot-per-mile-scandinavian' | 'foot-per-millimeter'
    | 'foot-per-milliliter' | 'foot-per-millisecond' | 'foot-per-minute' | 'foot-per-month' | 'foot-per-ounce'
    | 'foot-per-percent' | 'foot-per-petabyte' | 'foot-per-pound' | 'foot-per-second' | 'foot-per-stone'
    | 'foot-per-terabit' | 'foot-per-terabyte' | 'foot-per-week' | 'foot-per-yard' | 'foot-per-year' | 'gallon-per-acre'
    | 'gallon-per-bit' | 'gallon-per-byte' | 'gallon-per-celsius' | 'gallon-per-centimeter' | 'gallon-per-day'
    | 'gallon-per-degree' | 'gallon-per-fahrenheit' | 'gallon-per-fluid-ounce' | 'gallon-per-foot' | 'gallon-per-gallon'
    | 'gallon-per-gigabit' | 'gallon-per-gigabyte' | 'gallon-per-gram' | 'gallon-per-hectare' | 'gallon-per-hour'
    | 'gallon-per-inch' | 'gallon-per-kilobit' | 'gallon-per-kilobyte' | 'gallon-per-kilogram' | 'gallon-per-kilometer'
    | 'gallon-per-liter' | 'gallon-per-megabit' | 'gallon-per-megabyte' | 'gallon-per-meter' | 'gallon-per-mile'
    | 'gallon-per-mile-scandinavian' | 'gallon-per-millimeter' | 'gallon-per-milliliter' | 'gallon-per-millisecond'
    | 'gallon-per-minute' | 'gallon-per-month' | 'gallon-per-ounce' | 'gallon-per-percent' | 'gallon-per-petabyte'
    | 'gallon-per-pound' | 'gallon-per-second' | 'gallon-per-stone' | 'gallon-per-terabit' | 'gallon-per-terabyte'
    | 'gallon-per-week' | 'gallon-per-yard' | 'gallon-per-year' | 'gigabit-per-acre' | 'gigabit-per-bit'
    | 'gigabit-per-byte' | 'gigabit-per-celsius' | 'gigabit-per-centimeter' | 'gigabit-per-day' | 'gigabit-per-degree'
    | 'gigabit-per-fahrenheit' | 'gigabit-per-fluid-ounce' | 'gigabit-per-foot' | 'gigabit-per-gallon'
    | 'gigabit-per-gigabit' | 'gigabit-per-gigabyte' | 'gigabit-per-gram' | 'gigabit-per-hectare' | 'gigabit-per-hour'
    | 'gigabit-per-inch' | 'gigabit-per-kilobit' | 'gigabit-per-kilobyte' | 'gigabit-per-kilogram'
    | 'gigabit-per-kilometer' | 'gigabit-per-liter' | 'gigabit-per-megabit' | 'gigabit-per-megabyte'
    | 'gigabit-per-meter' | 'gigabit-per-mile' | 'gigabit-per-mile-scandinavian' | 'gigabit-per-millimeter'
    | 'gigabit-per-milliliter' | 'gigabit-per-millisecond' | 'gigabit-per-minute' | 'gigabit-per-month'
    | 'gigabit-per-ounce' | 'gigabit-per-percent' | 'gigabit-per-petabyte' | 'gigabit-per-pound' | 'gigabit-per-second'
    | 'gigabit-per-stone' | 'gigabit-per-terabit' | 'gigabit-per-terabyte' | 'gigabit-per-week' | 'gigabit-per-yard'
    | 'gigabit-per-year' | 'gigabyte-per-acre' | 'gigabyte-per-bit' | 'gigabyte-per-byte' | 'gigabyte-per-celsius'
    | 'gigabyte-per-centimeter' | 'gigabyte-per-day' | 'gigabyte-per-degree' | 'gigabyte-per-fahrenheit'
    | 'gigabyte-per-fluid-ounce' | 'gigabyte-per-foot' | 'gigabyte-per-gallon' | 'gigabyte-per-gigabit'
    | 'gigabyte-per-gigabyte' | 'gigabyte-per-gram' | 'gigabyte-per-hectare' | 'gigabyte-per-hour' | 'gigabyte-per-inch'
    | 'gigabyte-per-kilobit' | 'gigabyte-per-kilobyte' | 'gigabyte-per-kilogram' | 'gigabyte-per-kilometer'
    | 'gigabyte-per-liter' | 'gigabyte-per-megabit' | 'gigabyte-per-megabyte' | 'gigabyte-per-meter'
    | 'gigabyte-per-mile' | 'gigabyte-per-mile-scandinavian' | 'gigabyte-per-millimeter' | 'gigabyte-per-milliliter'
    | 'gigabyte-per-millisecond' | 'gigabyte-per-minute' | 'gigabyte-per-month' | 'gigabyte-per-ounce'
    | 'gigabyte-per-percent' | 'gigabyte-per-petabyte' | 'gigabyte-per-pound' | 'gigabyte-per-second'
    | 'gigabyte-per-stone' | 'gigabyte-per-terabit' | 'gigabyte-per-terabyte' | 'gigabyte-per-week'
    | 'gigabyte-per-yard' | 'gigabyte-per-year' | 'gram-per-acre' | 'gram-per-bit' | 'gram-per-byte'
    | 'gram-per-celsius' | 'gram-per-centimeter' | 'gram-per-day' | 'gram-per-degree' | 'gram-per-fahrenheit'
    | 'gram-per-fluid-ounce' | 'gram-per-foot' | 'gram-per-gallon' | 'gram-per-gigabit' | 'gram-per-gigabyte'
    | 'gram-per-gram' | 'gram-per-hectare' | 'gram-per-hour' | 'gram-per-inch' | 'gram-per-kilobit'
    | 'gram-per-kilobyte' | 'gram-per-kilogram' | 'gram-per-kilometer' | 'gram-per-liter' | 'gram-per-megabit'
    | 'gram-per-megabyte' | 'gram-per-meter' | 'gram-per-mile' | 'gram-per-mile-scandinavian' | 'gram-per-millimeter'
    | 'gram-per-milliliter' | 'gram-per-millisecond' | 'gram-per-minute' | 'gram-per-month' | 'gram-per-ounce'
    | 'gram-per-percent' | 'gram-per-petabyte' | 'gram-per-pound' | 'gram-per-second' | 'gram-per-stone'
    | 'gram-per-terabit' | 'gram-per-terabyte' | 'gram-per-week' | 'gram-per-yard' | 'gram-per-year'
    | 'hectare-per-acre' | 'hectare-per-bit' | 'hectare-per-byte' | 'hectare-per-celsius' | 'hectare-per-centimeter'
    | 'hectare-per-day' | 'hectare-per-degree' | 'hectare-per-fahrenheit' | 'hectare-per-fluid-ounce'
    | 'hectare-per-foot' | 'hectare-per-gallon' | 'hectare-per-gigabit' | 'hectare-per-gigabyte' | 'hectare-per-gram'
    | 'hectare-per-hectare' | 'hectare-per-hour' | 'hectare-per-inch' | 'hectare-per-kilobit' | 'hectare-per-kilobyte'
    | 'hectare-per-kilogram' | 'hectare-per-kilometer' | 'hectare-per-liter' | 'hectare-per-megabit'
    | 'hectare-per-megabyte' | 'hectare-per-meter' | 'hectare-per-mile' | 'hectare-per-mile-scandinavian'
    | 'hectare-per-millimeter' | 'hectare-per-milliliter' | 'hectare-per-millisecond' | 'hectare-per-minute'
    | 'hectare-per-month' | 'hectare-per-ounce' | 'hectare-per-percent' | 'hectare-per-petabyte' | 'hectare-per-pound'
    | 'hectare-per-second' | 'hectare-per-stone' | 'hectare-per-terabit' | 'hectare-per-terabyte' | 'hectare-per-week'
    | 'hectare-per-yard' | 'hectare-per-year' | 'hour-per-acre' | 'hour-per-bit' | 'hour-per-byte' | 'hour-per-celsius'
    | 'hour-per-centimeter' | 'hour-per-day' | 'hour-per-degree' | 'hour-per-fahrenheit' | 'hour-per-fluid-ounce'
    | 'hour-per-foot' | 'hour-per-gallon' | 'hour-per-gigabit' | 'hour-per-gigabyte' | 'hour-per-gram'
    | 'hour-per-hectare' | 'hour-per-hour' | 'hour-per-inch' | 'hour-per-kilobit' | 'hour-per-kilobyte'
    | 'hour-per-kilogram' | 'hour-per-kilometer' | 'hour-per-liter' | 'hour-per-megabit' | 'hour-per-megabyte'
    | 'hour-per-meter' | 'hour-per-mile' | 'hour-per-mile-scandinavian' | 'hour-per-millimeter' | 'hour-per-milliliter'
    | 'hour-per-millisecond' | 'hour-per-minute' | 'hour-per-month' | 'hour-per-ounce' | 'hour-per-percent'
    | 'hour-per-petabyte' | 'hour-per-pound' | 'hour-per-second' | 'hour-per-stone' | 'hour-per-terabit'
    | 'hour-per-terabyte' | 'hour-per-week' | 'hour-per-yard' | 'hour-per-year' | 'inch-per-acre' | 'inch-per-bit'
    | 'inch-per-byte' | 'inch-per-celsius' | 'inch-per-centimeter' | 'inch-per-day' | 'inch-per-degree'
    | 'inch-per-fahrenheit' | 'inch-per-fluid-ounce' | 'inch-per-foot' | 'inch-per-gallon' | 'inch-per-gigabit'
    | 'inch-per-gigabyte' | 'inch-per-gram' | 'inch-per-hectare' | 'inch-per-hour' | 'inch-per-inch'
    | 'inch-per-kilobit' | 'inch-per-kilobyte' | 'inch-per-kilogram' | 'inch-per-kilometer' | 'inch-per-liter'
    | 'inch-per-megabit' | 'inch-per-megabyte' | 'inch-per-meter' | 'inch-per-mile' | 'inch-per-mile-scandinavian'
    | 'inch-per-millimeter' | 'inch-per-milliliter' | 'inch-per-millisecond' | 'inch-per-minute' | 'inch-per-month'
    | 'inch-per-ounce' | 'inch-per-percent' | 'inch-per-petabyte' | 'inch-per-pound' | 'inch-per-second'
    | 'inch-per-stone' | 'inch-per-terabit' | 'inch-per-terabyte' | 'inch-per-week' | 'inch-per-yard' | 'inch-per-year'
    | 'kilobit-per-acre' | 'kilobit-per-bit' | 'kilobit-per-byte' | 'kilobit-per-celsius' | 'kilobit-per-centimeter'
    | 'kilobit-per-day' | 'kilobit-per-degree' | 'kilobit-per-fahrenheit' | 'kilobit-per-fluid-ounce'
    | 'kilobit-per-foot' | 'kilobit-per-gallon' | 'kilobit-per-gigabit' | 'kilobit-per-gigabyte' | 'kilobit-per-gram'
    | 'kilobit-per-hectare' | 'kilobit-per-hour' | 'kilobit-per-inch' | 'kilobit-per-kilobit' | 'kilobit-per-kilobyte'
    | 'kilobit-per-kilogram' | 'kilobit-per-kilometer' | 'kilobit-per-liter' | 'kilobit-per-megabit' | 'kilobit-per-megabyte'
    | 'kilobit-per-meter' | 'kilobit-per-mile' | 'kilobit-per-mile-scandinavian' | 'kilobit-per-millimeter'
    | 'kilobit-per-milliliter' | 'kilobit-per-millisecond' | 'kilobit-per-minute' | 'kilobit-per-month'
    | 'kilobit-per-ounce' | 'kilobit-per-percent' | 'kilobit-per-petabyte' | 'kilobit-per-pound' | 'kilobit-per-second'
    | 'kilobit-per-stone' | 'kilobit-per-terabit' | 'kilobit-per-terabyte' | 'kilobit-per-week' | 'kilobit-per-yard'
    | 'kilobit-per-year' | 'kilobyte-per-acre' | 'kilobyte-per-bit' | 'kilobyte-per-byte' | 'kilobyte-per-celsius'
    | 'kilobyte-per-centimeter' | 'kilobyte-per-day' | 'kilobyte-per-degree' | 'kilobyte-per-fahrenheit'
    | 'kilobyte-per-fluid-ounce' | 'kilobyte-per-foot' | 'kilobyte-per-gallon' | 'kilobyte-per-gigabit'
    | 'kilobyte-per-gigabyte' | 'kilobyte-per-gram' | 'kilobyte-per-hectare' | 'kilobyte-per-hour' | 'kilobyte-per-inch'
    | 'kilobyte-per-kilobit' | 'kilobyte-per-kilobyte' | 'kilobyte-per-kilogram' | 'kilobyte-per-kilometer'
    | 'kilobyte-per-liter' | 'kilobyte-per-megabit' | 'kilobyte-per-megabyte' | 'kilobyte-per-meter'
    | 'kilobyte-per-mile' | 'kilobyte-per-mile-scandinavian' | 'kilobyte-per-millimeter' | 'kilobyte-per-milliliter'
    | 'kilobyte-per-millisecond' | 'kilobyte-per-minute' | 'kilobyte-per-month' | 'kilobyte-per-ounce'
    | 'kilobyte-per-percent' | 'kilobyte-per-petabyte' | 'kilobyte-per-pound' | 'kilobyte-per-second'
    | 'kilobyte-per-stone' | 'kilobyte-per-terabit' | 'kilobyte-per-terabyte' | 'kilobyte-per-week'
    | 'kilobyte-per-yard' | 'kilobyte-per-year' | 'kilogram-per-acre' | 'kilogram-per-bit' | 'kilogram-per-byte'
    | 'kilogram-per-celsius' | 'kilogram-per-centimeter' | 'kilogram-per-day' | 'kilogram-per-degree'
    | 'kilogram-per-fahrenheit' | 'kilogram-per-fluid-ounce' | 'kilogram-per-foot' | 'kilogram-per-gallon'
    | 'kilogram-per-gigabit' | 'kilogram-per-gigabyte' | 'kilogram-per-gram' | 'kilogram-per-hectare'
    | 'kilogram-per-hour' | 'kilogram-per-inch' | 'kilogram-per-kilobit' | 'kilogram-per-kilobyte'
    | 'kilogram-per-kilogram' | 'kilogram-per-kilometer' | 'kilogram-per-liter' | 'kilogram-per-megabit'
    | 'kilogram-per-megabyte' | 'kilogram-per-meter' | 'kilogram-per-mile' | 'kilogram-per-mile-scandinavian'
    | 'kilogram-per-millimeter' | 'kilogram-per-milliliter' | 'kilogram-per-millisecond' | 'kilogram-per-minute'
    | 'kilogram-per-month' | 'kilogram-per-ounce' | 'kilogram-per-percent' | 'kilogram-per-petabyte'
    | 'kilogram-per-pound' | 'kilogram-per-second' | 'kilogram-per-stone' | 'kilogram-per-terabit'
    | 'kilogram-per-terabyte' | 'kilogram-per-week' | 'kilogram-per-yard' | 'kilogram-per-year' | 'kilometer-per-acre'
    | 'kilometer-per-bit' | 'kilometer-per-byte' | 'kilometer-per-celsius' | 'kilometer-per-centimeter'
    | 'kilometer-per-day' | 'kilometer-per-degree' | 'kilometer-per-fahrenheit' | 'kilometer-per-fluid-ounce'
    | 'kilometer-per-foot' | 'kilometer-per-gallon' | 'kilometer-per-gigabit' | 'kilometer-per-gigabyte'
    | 'kilometer-per-gram' | 'kilometer-per-hectare' | 'kilometer-per-hour' | 'kilometer-per-inch'
    | 'kilometer-per-kilobit' | 'kilometer-per-kilobyte' | 'kilometer-per-kilogram' | 'kilometer-per-kilometer'
    | 'kilometer-per-liter' | 'kilometer-per-megabit' | 'kilometer-per-megabyte' | 'kilometer-per-meter'
    | 'kilometer-per-mile' | 'kilometer-per-mile-scandinavian' | 'kilometer-per-millimeter' | 'kilometer-per-milliliter'
    | 'kilometer-per-millisecond' | 'kilometer-per-minute' | 'kilometer-per-month' | 'kilometer-per-ounce'
    | 'kilometer-per-percent' | 'kilometer-per-petabyte' | 'kilometer-per-pound' | 'kilometer-per-second'
    | 'kilometer-per-stone' | 'kilometer-per-terabit' | 'kilometer-per-terabyte' | 'kilometer-per-week'
    | 'kilometer-per-yard' | 'kilometer-per-year' | 'liter-per-acre' | 'liter-per-bit' | 'liter-per-byte'
    | 'liter-per-celsius' | 'liter-per-centimeter' | 'liter-per-day' | 'liter-per-degree' | 'liter-per-fahrenheit'
    | 'liter-per-fluid-ounce' | 'liter-per-foot' | 'liter-per-gallon' | 'liter-per-gigabit' | 'liter-per-gigabyte'
    | 'liter-per-gram' | 'liter-per-hectare' | 'liter-per-hour' | 'liter-per-inch' | 'liter-per-kilobit'
    | 'liter-per-kilobyte' | 'liter-per-kilogram' | 'liter-per-kilometer' | 'liter-per-liter' | 'liter-per-megabit'
    | 'liter-per-megabyte' | 'liter-per-meter' | 'liter-per-mile' | 'liter-per-mile-scandinavian'
    | 'liter-per-millimeter' | 'liter-per-milliliter' | 'liter-per-millisecond' | 'liter-per-minute' | 'liter-per-month'
    | 'liter-per-ounce' | 'liter-per-percent' | 'liter-per-petabyte' | 'liter-per-pound' | 'liter-per-second'
    | 'liter-per-stone' | 'liter-per-terabit' | 'liter-per-terabyte' | 'liter-per-week' | 'liter-per-yard'
    | 'liter-per-year' | 'megabit-per-acre' | 'megabit-per-bit' | 'megabit-per-byte' | 'megabit-per-celsius'
    | 'megabit-per-centimeter' | 'megabit-per-day' | 'megabit-per-degree' | 'megabit-per-fahrenheit'
    | 'megabit-per-fluid-ounce' | 'megabit-per-foot' | 'megabit-per-gallon' | 'megabit-per-gigabit'
    | 'megabit-per-gigabyte' | 'megabit-per-gram' | 'megabit-per-hectare' | 'megabit-per-hour' | 'megabit-per-inch'
    | 'megabit-per-kilobit' | 'megabit-per-kilobyte' | 'megabit-per-kilogram' | 'megabit-per-kilometer'
    | 'megabit-per-liter' | 'megabit-per-megabit' | 'megabit-per-megabyte' | 'megabit-per-meter' | 'megabit-per-mile'
    | 'megabit-per-mile-scandinavian' | 'megabit-per-millimeter' | 'megabit-per-milliliter' | 'megabit-per-millisecond'
    | 'megabit-per-minute' | 'megabit-per-month' | 'megabit-per-ounce' | 'megabit-per-percent' | 'megabit-per-petabyte'
    | 'megabit-per-pound' | 'megabit-per-second' | 'megabit-per-stone' | 'megabit-per-terabit' | 'megabit-per-terabyte'
    | 'megabit-per-week' | 'megabit-per-yard' | 'megabit-per-year' | 'megabyte-per-acre' | 'megabyte-per-bit'
    | 'megabyte-per-byte' | 'megabyte-per-celsius' | 'megabyte-per-centimeter' | 'megabyte-per-day'
    | 'megabyte-per-degree' | 'megabyte-per-fahrenheit' | 'megabyte-per-fluid-ounce' | 'megabyte-per-foot'
    | 'megabyte-per-gallon' | 'megabyte-per-gigabit' | 'megabyte-per-gigabyte' | 'megabyte-per-gram'
    | 'megabyte-per-hectare' | 'megabyte-per-hour' | 'megabyte-per-inch' | 'megabyte-per-kilobit'
    | 'megabyte-per-kilobyte' | 'megabyte-per-kilogram' | 'megabyte-per-kilometer' | 'megabyte-per-liter'
    | 'megabyte-per-megabit' | 'megabyte-per-megabyte' | 'megabyte-per-meter' | 'megabyte-per-mile'
    | 'megabyte-per-mile-scandinavian' | 'megabyte-per-millimeter' | 'megabyte-per-milliliter'
    | 'megabyte-per-millisecond' | 'megabyte-per-minute' | 'megabyte-per-month' | 'megabyte-per-ounce'
    | 'megabyte-per-percent' | 'megabyte-per-petabyte' | 'megabyte-per-pound' | 'megabyte-per-second'
    | 'megabyte-per-stone' | 'megabyte-per-terabit' | 'megabyte-per-terabyte' | 'megabyte-per-week'
    | 'megabyte-per-yard' | 'megabyte-per-year' | 'meter-per-acre' | 'meter-per-bit' | 'meter-per-byte'
    | 'meter-per-celsius' | 'meter-per-centimeter' | 'meter-per-day' | 'meter-per-degree' | 'meter-per-fahrenheit'
    | 'meter-per-fluid-ounce' | 'meter-per-foot' | 'meter-per-gallon' | 'meter-per-gigabit' | 'meter-per-gigabyte'
    | 'meter-per-gram' | 'meter-per-hectare' | 'meter-per-hour' | 'meter-per-inch' | 'meter-per-kilobit'
    | 'meter-per-kilobyte' | 'meter-per-kilogram' | 'meter-per-kilometer' | 'meter-per-liter' | 'meter-per-megabit'
    | 'meter-per-megabyte' | 'meter-per-meter' | 'meter-per-mile' | 'meter-per-mile-scandinavian'
    | 'meter-per-millimeter' | 'meter-per-milliliter' | 'meter-per-millisecond' | 'meter-per-minute' | 'meter-per-month'
    | 'meter-per-ounce' | 'meter-per-percent' | 'meter-per-petabyte' | 'meter-per-pound' | 'meter-per-second'
    | 'meter-per-stone' | 'meter-per-terabit' | 'meter-per-terabyte' | 'meter-per-week' | 'meter-per-yard'
    | 'meter-per-year' | 'mile-per-acre' | 'mile-per-bit' | 'mile-per-byte' | 'mile-per-celsius'
    | 'mile-per-centimeter' | 'mile-per-day' | 'mile-per-degree' | 'mile-per-fahrenheit' | 'mile-per-fluid-ounce'
    | 'mile-per-foot' | 'mile-per-gallon' | 'mile-per-gigabit' | 'mile-per-gigabyte' | 'mile-per-gram'
    | 'mile-per-hectare' | 'mile-per-hour' | 'mile-per-inch' | 'mile-per-kilobit' | 'mile-per-kilobyte'
    | 'mile-per-kilogram' | 'mile-per-kilometer' | 'mile-per-liter' | 'mile-per-megabit' | 'mile-per-megabyte'
    | 'mile-per-meter' | 'mile-per-mile' | 'mile-per-mile-scandinavian' | 'mile-per-millimeter' | 'mile-per-milliliter'
    | 'mile-per-millisecond' | 'mile-per-minute' | 'mile-per-month' | 'mile-per-ounce' | 'mile-per-percent'
    | 'mile-per-petabyte' | 'mile-per-pound' | 'mile-per-second' | 'mile-per-stone' | 'mile-per-terabit'
    | 'mile-per-terabyte' | 'mile-per-week' | 'mile-per-yard' | 'mile-per-year' | 'mile-scandinavian-per-acre'
    | 'mile-scandinavian-per-bit' | 'mile-scandinavian-per-byte' | 'mile-scandinavian-per-celsius'
    | 'mile-scandinavian-per-centimeter' | 'mile-scandinavian-per-day' | 'mile-scandinavian-per-degree'
    | 'mile-scandinavian-per-fahrenheit' | 'mile-scandinavian-per-fluid-ounce' | 'mile-scandinavian-per-foot'
    | 'mile-scandinavian-per-gallon' | 'mile-scandinavian-per-gigabit' | 'mile-scandinavian-per-gigabyte'
    | 'mile-scandinavian-per-gram' | 'mile-scandinavian-per-hectare' | 'mile-scandinavian-per-hour'
    | 'mile-scandinavian-per-inch' | 'mile-scandinavian-per-kilobit' | 'mile-scandinavian-per-kilobyte'
    | 'mile-scandinavian-per-kilogram' | 'mile-scandinavian-per-kilometer' | 'mile-scandinavian-per-liter'
    | 'mile-scandinavian-per-megabit' | 'mile-scandinavian-per-megabyte' | 'mile-scandinavian-per-meter'
    | 'mile-scandinavian-per-mile' | 'mile-scandinavian-per-mile-scandinavian' | 'mile-scandinavian-per-millimeter'
    | 'mile-scandinavian-per-milliliter' | 'mile-scandinavian-per-millisecond' | 'mile-scandinavian-per-minute'
    | 'mile-scandinavian-per-month' | 'mile-scandinavian-per-ounce' | 'mile-scandinavian-per-percent'
    | 'mile-scandinavian-per-petabyte' | 'mile-scandinavian-per-pound' | 'mile-scandinavian-per-second'
    | 'mile-scandinavian-per-stone' | 'mile-scandinavian-per-terabit' | 'mile-scandinavian-per-terabyte'
    | 'mile-scandinavian-per-week' | 'mile-scandinavian-per-yard' | 'mile-scandinavian-per-year' | 'millimeter-per-acre'
    | 'millimeter-per-bit' | 'millimeter-per-byte' | 'millimeter-per-celsius' | 'millimeter-per-centimeter'
    | 'millimeter-per-day' | 'millimeter-per-degree' | 'millimeter-per-fahrenheit' | 'millimeter-per-fluid-ounce'
    | 'millimeter-per-foot' | 'millimeter-per-gallon' | 'millimeter-per-gigabit' | 'millimeter-per-gigabyte'
    | 'millimeter-per-gram' | 'millimeter-per-hectare' | 'millimeter-per-hour' | 'millimeter-per-inch'
    | 'millimeter-per-kilobit' | 'millimeter-per-kilobyte' | 'millimeter-per-kilogram' | 'millimeter-per-kilometer'
    | 'millimeter-per-liter' | 'millimeter-per-megabit' | 'millimeter-per-megabyte' | 'millimeter-per-meter'
    | 'millimeter-per-mile' | 'millimeter-per-mile-scandinavian' | 'millimeter-per-millimeter'
    | 'millimeter-per-milliliter' | 'millimeter-per-millisecond' | 'millimeter-per-minute' | 'millimeter-per-month'
    | 'millimeter-per-ounce' | 'millimeter-per-percent' | 'millimeter-per-petabyte' | 'millimeter-per-pound'
    | 'millimeter-per-second' | 'millimeter-per-stone' | 'millimeter-per-terabit' | 'millimeter-per-terabyte'
    | 'millimeter-per-week' | 'millimeter-per-yard' | 'millimeter-per-year' | 'milliliter-per-acre'
    | 'milliliter-per-bit' | 'milliliter-per-byte' | 'milliliter-per-celsius' | 'milliliter-per-centimeter'
    | 'milliliter-per-day' | 'milliliter-per-degree' | 'milliliter-per-fahrenheit' | 'milliliter-per-fluid-ounce'
    | 'milliliter-per-foot' | 'milliliter-per-gallon' | 'milliliter-per-gigabit' | 'milliliter-per-gigabyte'
    | 'milliliter-per-gram' | 'milliliter-per-hectare' | 'milliliter-per-hour' | 'milliliter-per-inch'
    | 'milliliter-per-kilobit' | 'milliliter-per-kilobyte' | 'milliliter-per-kilogram' | 'milliliter-per-kilometer'
    | 'milliliter-per-liter' | 'milliliter-per-megabit' | 'milliliter-per-megabyte' | 'milliliter-per-meter'
    | 'milliliter-per-mile' | 'milliliter-per-mile-scandinavian' | 'milliliter-per-millimeter'
    | 'milliliter-per-milliliter' | 'milliliter-per-millisecond' | 'milliliter-per-minute' | 'milliliter-per-month'
    | 'milliliter-per-ounce' | 'milliliter-per-percent' | 'milliliter-per-petabyte' | 'milliliter-per-pound'
    | 'milliliter-per-second' | 'milliliter-per-stone' | 'milliliter-per-terabit' | 'milliliter-per-terabyte'
    | 'milliliter-per-week' | 'milliliter-per-yard' | 'milliliter-per-year' | 'millisecond-per-acre'
    | 'millisecond-per-bit' | 'millisecond-per-byte' | 'millisecond-per-celsius' | 'millisecond-per-centimeter'
    | 'millisecond-per-day' | 'millisecond-per-degree' | 'millisecond-per-fahrenheit' | 'millisecond-per-fluid-ounce'
    | 'millisecond-per-foot' | 'millisecond-per-gallon' | 'millisecond-per-gigabit' | 'millisecond-per-gigabyte'
    | 'millisecond-per-gram' | 'millisecond-per-hectare' | 'millisecond-per-hour' | 'millisecond-per-inch'
    | 'millisecond-per-kilobit' | 'millisecond-per-kilobyte' | 'millisecond-per-kilogram' | 'millisecond-per-kilometer'
    | 'millisecond-per-liter' | 'millisecond-per-megabit' | 'millisecond-per-megabyte' | 'millisecond-per-meter'
    | 'millisecond-per-mile' | 'millisecond-per-mile-scandinavian' | 'millisecond-per-millimeter'
    | 'millisecond-per-milliliter' | 'millisecond-per-millisecond' | 'millisecond-per-minute' | 'millisecond-per-month'
    | 'millisecond-per-ounce' | 'millisecond-per-percent' | 'millisecond-per-petabyte' | 'millisecond-per-pound'
    | 'millisecond-per-second' | 'millisecond-per-stone' | 'millisecond-per-terabit' | 'millisecond-per-terabyte'
    | 'millisecond-per-week' | 'millisecond-per-yard' | 'millisecond-per-year' | 'minute-per-acre' | 'minute-per-bit'
    | 'minute-per-byte' | 'minute-per-celsius' | 'minute-per-centimeter' | 'minute-per-day' | 'minute-per-degree'
    | 'minute-per-fahrenheit' | 'minute-per-fluid-ounce' | 'minute-per-foot' | 'minute-per-gallon'
    | 'minute-per-gigabit' | 'minute-per-gigabyte' | 'minute-per-gram' | 'minute-per-hectare' | 'minute-per-hour'
    | 'minute-per-inch' | 'minute-per-kilobit' | 'minute-per-kilobyte' | 'minute-per-kilogram' | 'minute-per-kilometer'
    | 'minute-per-liter' | 'minute-per-megabit' | 'minute-per-megabyte' | 'minute-per-meter' | 'minute-per-mile'
    | 'minute-per-mile-scandinavian' | 'minute-per-millimeter' | 'minute-per-milliliter' | 'minute-per-millisecond'
    | 'minute-per-minute' | 'minute-per-month' | 'minute-per-ounce' | 'minute-per-percent' | 'minute-per-petabyte'
    | 'minute-per-pound' | 'minute-per-second' | 'minute-per-stone' | 'minute-per-terabit' | 'minute-per-terabyte'
    | 'minute-per-week' | 'minute-per-yard' | 'minute-per-year' | 'month-per-acre' | 'month-per-bit' | 'month-per-byte'
    | 'month-per-celsius' | 'month-per-centimeter' | 'month-per-day' | 'month-per-degree' | 'month-per-fahrenheit'
    | 'month-per-fluid-ounce' | 'month-per-foot' | 'month-per-gallon' | 'month-per-gigabit' | 'month-per-gigabyte'
    | 'month-per-gram' | 'month-per-hectare' | 'month-per-hour' | 'month-per-inch' | 'month-per-kilobit'
    | 'month-per-kilobyte' | 'month-per-kilogram' | 'month-per-kilometer' | 'month-per-liter' | 'month-per-megabit'
    | 'month-per-megabyte' | 'month-per-meter' | 'month-per-mile' | 'month-per-mile-scandinavian'
    | 'month-per-millimeter' | 'month-per-milliliter' | 'month-per-millisecond' | 'month-per-minute' | 'month-per-month'
    | 'month-per-ounce' | 'month-per-percent' | 'month-per-petabyte' | 'month-per-pound' | 'month-per-second'
    | 'month-per-stone' | 'month-per-terabit' | 'month-per-terabyte' | 'month-per-week' | 'month-per-yard'
    | 'month-per-year' | 'ounce-per-acre' | 'ounce-per-bit' | 'ounce-per-byte' | 'ounce-per-celsius'
    | 'ounce-per-centimeter' | 'ounce-per-day' | 'ounce-per-degree' | 'ounce-per-fahrenheit' | 'ounce-per-fluid-ounce'
    | 'ounce-per-foot' | 'ounce-per-gallon' | 'ounce-per-gigabit' | 'ounce-per-gigabyte' | 'ounce-per-gram'
    | 'ounce-per-hectare' | 'ounce-per-hour' | 'ounce-per-inch' | 'ounce-per-kilobit' | 'ounce-per-kilobyte'
    | 'ounce-per-kilogram' | 'ounce-per-kilometer' | 'ounce-per-liter' | 'ounce-per-megabit' | 'ounce-per-megabyte'
    | 'ounce-per-meter' | 'ounce-per-mile' | 'ounce-per-mile-scandinavian' | 'ounce-per-millimeter'
    | 'ounce-per-milliliter' | 'ounce-per-millisecond' | 'ounce-per-minute' | 'ounce-per-month' | 'ounce-per-ounce'
    | 'ounce-per-percent' | 'ounce-per-petabyte' | 'ounce-per-pound' | 'ounce-per-second' | 'ounce-per-stone'
    | 'ounce-per-terabit' | 'ounce-per-terabyte' | 'ounce-per-week' | 'ounce-per-yard' | 'ounce-per-year'
    | 'percent-per-acre' | 'percent-per-bit' | 'percent-per-byte' | 'percent-per-celsius' | 'percent-per-centimeter'
    | 'percent-per-day' | 'percent-per-degree' | 'percent-per-fahrenheit' | 'percent-per-fluid-ounce'
    | 'percent-per-foot' | 'percent-per-gallon' | 'percent-per-gigabit' | 'percent-per-gigabyte' | 'percent-per-gram'
    | 'percent-per-hectare' | 'percent-per-hour' | 'percent-per-inch' | 'percent-per-kilobit' | 'percent-per-kilobyte'
    | 'percent-per-kilogram' | 'percent-per-kilometer' | 'percent-per-liter' | 'percent-per-megabit'
    | 'percent-per-megabyte' | 'percent-per-meter' | 'percent-per-mile' | 'percent-per-mile-scandinavian'
    | 'percent-per-millimeter' | 'percent-per-milliliter' | 'percent-per-millisecond' | 'percent-per-minute'
    | 'percent-per-month' | 'percent-per-ounce' | 'percent-per-percent' | 'percent-per-petabyte' | 'percent-per-pound'
    | 'percent-per-second' | 'percent-per-stone' | 'percent-per-terabit' | 'percent-per-terabyte' | 'percent-per-week'
    | 'percent-per-yard' | 'percent-per-year' | 'petabyte-per-acre' | 'petabyte-per-bit' | 'petabyte-per-byte'
    | 'petabyte-per-celsius' | 'petabyte-per-centimeter' | 'petabyte-per-day' | 'petabyte-per-degree'
    | 'petabyte-per-fahrenheit' | 'petabyte-per-fluid-ounce' | 'petabyte-per-foot' | 'petabyte-per-gallon'
    | 'petabyte-per-gigabit' | 'petabyte-per-gigabyte' | 'petabyte-per-gram' | 'petabyte-per-hectare'
    | 'petabyte-per-hour' | 'petabyte-per-inch' | 'petabyte-per-kilobit' | 'petabyte-per-kilobyte'
    | 'petabyte-per-kilogram' | 'petabyte-per-kilometer' | 'petabyte-per-liter' | 'petabyte-per-megabit'
    | 'petabyte-per-megabyte' | 'petabyte-per-meter' | 'petabyte-per-mile' | 'petabyte-per-mile-scandinavian'
    | 'petabyte-per-millimeter' | 'petabyte-per-milliliter' | 'petabyte-per-millisecond' | 'petabyte-per-minute'
    | 'petabyte-per-month' | 'petabyte-per-ounce' | 'petabyte-per-percent' | 'petabyte-per-petabyte'
    | 'petabyte-per-pound' | 'petabyte-per-second' | 'petabyte-per-stone' | 'petabyte-per-terabit'
    | 'petabyte-per-terabyte' | 'petabyte-per-week' | 'petabyte-per-yard' | 'petabyte-per-year' | 'pound-per-acre'
    | 'pound-per-bit' | 'pound-per-byte' | 'pound-per-celsius' | 'pound-per-centimeter' | 'pound-per-day'
    | 'pound-per-degree' | 'pound-per-fahrenheit' | 'pound-per-fluid-ounce' | 'pound-per-foot' | 'pound-per-gallon'
    | 'pound-per-gigabit' | 'pound-per-gigabyte' | 'pound-per-gram' | 'pound-per-hectare' | 'pound-per-hour'
    | 'pound-per-inch' | 'pound-per-kilobit' | 'pound-per-kilobyte' | 'pound-per-kilogram' | 'pound-per-kilometer'
    | 'pound-per-liter' | 'pound-per-megabit' | 'pound-per-megabyte' | 'pound-per-meter' | 'pound-per-mile'
    | 'pound-per-mile-scandinavian' | 'pound-per-millimeter' | 'pound-per-milliliter' | 'pound-per-millisecond'
    | 'pound-per-minute' | 'pound-per-month' | 'pound-per-ounce' | 'pound-per-percent' | 'pound-per-petabyte'
    | 'pound-per-pound' | 'pound-per-second' | 'pound-per-stone' | 'pound-per-terabit' | 'pound-per-terabyte'
    | 'pound-per-week' | 'pound-per-yard' | 'pound-per-year' | 'second-per-acre' | 'second-per-bit'
    | 'second-per-byte' | 'second-per-celsius' | 'second-per-centimeter' | 'second-per-day' | 'second-per-degree'
    | 'second-per-fahrenheit' | 'second-per-fluid-ounce' | 'second-per-foot' | 'second-per-gallon'
    | 'second-per-gigabit' | 'second-per-gigabyte' | 'second-per-gram' | 'second-per-hectare' | 'second-per-hour'
    | 'second-per-inch' | 'second-per-kilobit' | 'second-per-kilobyte' | 'second-per-kilogram' | 'second-per-kilometer'
    | 'second-per-liter' | 'second-per-megabit' | 'second-per-megabyte' | 'second-per-meter' | 'second-per-mile'
    | 'second-per-mile-scandinavian' | 'second-per-millimeter' | 'second-per-milliliter' | 'second-per-millisecond'
    | 'second-per-minute' | 'second-per-month' | 'second-per-ounce' | 'second-per-percent' | 'second-per-petabyte'
    | 'second-per-pound' | 'second-per-second' | 'second-per-stone' | 'second-per-terabit' | 'second-per-terabyte'
    | 'second-per-week' | 'second-per-yard' | 'second-per-year' | 'stone-per-acre' | 'stone-per-bit' | 'stone-per-byte'
    | 'stone-per-celsius' | 'stone-per-centimeter' | 'stone-per-day' | 'stone-per-degree' | 'stone-per-fahrenheit'
    | 'stone-per-fluid-ounce' | 'stone-per-foot' | 'stone-per-gallon' | 'stone-per-gigabit' | 'stone-per-gigabyte'
    | 'stone-per-gram' | 'stone-per-hectare' | 'stone-per-hour' | 'stone-per-inch' | 'stone-per-kilobit'
    | 'stone-per-kilobyte' | 'stone-per-kilogram' | 'stone-per-kilometer' | 'stone-per-liter' | 'stone-per-megabit'
    | 'stone-per-megabyte' | 'stone-per-meter' | 'stone-per-mile' | 'stone-per-mile-scandinavian'
    | 'stone-per-millimeter' | 'stone-per-milliliter' | 'stone-per-millisecond' | 'stone-per-minute' | 'stone-per-month'
    | 'stone-per-ounce' | 'stone-per-percent' | 'stone-per-petabyte' | 'stone-per-pound' | 'stone-per-second'
    | 'stone-per-stone' | 'stone-per-terabit' | 'stone-per-terabyte' | 'stone-per-week' | 'stone-per-yard'
    | 'stone-per-year' | 'terabit-per-acre' | 'terabit-per-bit' | 'terabit-per-byte' | 'terabit-per-celsius'
    | 'terabit-per-centimeter' | 'terabit-per-day' | 'terabit-per-degree' | 'terabit-per-fahrenheit'
    | 'terabit-per-fluid-ounce' | 'terabit-per-foot' | 'terabit-per-gallon' | 'terabit-per-gigabit'
    | 'terabit-per-gigabyte' | 'terabit-per-gram' | 'terabit-per-hectare' | 'terabit-per-hour' | 'terabit-per-inch'
    | 'terabit-per-kilobit' | 'terabit-per-kilobyte' | 'terabit-per-kilogram' | 'terabit-per-kilometer'
    | 'terabit-per-liter' | 'terabit-per-megabit' | 'terabit-per-megabyte' | 'terabit-per-meter'
    | 'terabit-per-mile' | 'terabit-per-mile-scandinavian' | 'terabit-per-millimeter' | 'terabit-per-milliliter'
    | 'terabit-per-millisecond' | 'terabit-per-minute' | 'terabit-per-month' | 'terabit-per-ounce'
    | 'terabit-per-percent' | 'terabit-per-petabyte' | 'terabit-per-pound' | 'terabit-per-second' | 'terabit-per-stone'
    | 'terabit-per-terabit' | 'terabit-per-terabyte' | 'terabit-per-week' | 'terabit-per-yard' | 'terabit-per-year'
    | 'terabyte-per-acre' | 'terabyte-per-bit' | 'terabyte-per-byte' | 'terabyte-per-celsius'
    | 'terabyte-per-centimeter' | 'terabyte-per-day' | 'terabyte-per-degree' | 'terabyte-per-fahrenheit'
    | 'terabyte-per-fluid-ounce' | 'terabyte-per-foot' | 'terabyte-per-gallon' | 'terabyte-per-gigabit'
    | 'terabyte-per-gigabyte' | 'terabyte-per-gram' | 'terabyte-per-hectare' | 'terabyte-per-hour' | 'terabyte-per-inch'
    | 'terabyte-per-kilobit' | 'terabyte-per-kilobyte' | 'terabyte-per-kilogram' | 'terabyte-per-kilometer'
    | 'terabyte-per-liter' | 'terabyte-per-megabit' | 'terabyte-per-megabyte' | 'terabyte-per-meter'
    | 'terabyte-per-mile' | 'terabyte-per-mile-scandinavian' | 'terabyte-per-millimeter' | 'terabyte-per-milliliter'
    | 'terabyte-per-millisecond' | 'terabyte-per-minute' | 'terabyte-per-month' | 'terabyte-per-ounce'
    | 'terabyte-per-percent' | 'terabyte-per-petabyte' | 'terabyte-per-pound' | 'terabyte-per-second'
    | 'terabyte-per-stone' | 'terabyte-per-terabit' | 'terabyte-per-terabyte' | 'terabyte-per-week'
    | 'terabyte-per-yard' | 'terabyte-per-year' | 'week-per-acre' | 'week-per-bit' | 'week-per-byte'
    | 'week-per-celsius' | 'week-per-centimeter' | 'week-per-day' | 'week-per-degree' | 'week-per-fahrenheit'
    | 'week-per-fluid-ounce' | 'week-per-foot' | 'week-per-gallon' | 'week-per-gigabit' | 'week-per-gigabyte'
    | 'week-per-gram' | 'week-per-hectare' | 'week-per-hour' | 'week-per-inch' | 'week-per-kilobit'
    | 'week-per-kilobyte' | 'week-per-kilogram' | 'week-per-kilometer' | 'week-per-liter' | 'week-per-megabit'
    | 'week-per-megabyte' | 'week-per-meter' | 'week-per-mile' | 'week-per-mile-scandinavian' | 'week-per-millimeter'
    | 'week-per-milliliter' | 'week-per-millisecond' | 'week-per-minute' | 'week-per-month' | 'week-per-ounce'
    | 'week-per-percent' | 'week-per-petabyte' | 'week-per-pound' | 'week-per-second' | 'week-per-stone'
    | 'week-per-terabit' | 'week-per-terabyte' | 'week-per-week' | 'week-per-yard' | 'week-per-year' | 'yard-per-acre'
    | 'yard-per-bit' | 'yard-per-byte' | 'yard-per-celsius' | 'yard-per-centimeter' | 'yard-per-day' | 'yard-per-degree'
    | 'yard-per-fahrenheit' | 'yard-per-fluid-ounce' | 'yard-per-foot' | 'yard-per-gallon' | 'yard-per-gigabit'
    | 'yard-per-gigabyte' | 'yard-per-gram' | 'yard-per-hectare' | 'yard-per-hour' | 'yard-per-inch'
    | 'yard-per-kilobit' | 'yard-per-kilobyte' | 'yard-per-kilogram' | 'yard-per-kilometer' | 'yard-per-liter'
    | 'yard-per-megabit' | 'yard-per-megabyte' | 'yard-per-meter' | 'yard-per-mile' | 'yard-per-mile-scandinavian'
    | 'yard-per-millimeter' | 'yard-per-milliliter' | 'yard-per-millisecond' | 'yard-per-minute' | 'yard-per-month'
    | 'yard-per-ounce' | 'yard-per-percent' | 'yard-per-petabyte' | 'yard-per-pound' | 'yard-per-second'
    | 'yard-per-stone' | 'yard-per-terabit' | 'yard-per-terabyte' | 'yard-per-week' | 'yard-per-yard' | 'yard-per-year'
    | 'year-per-acre' | 'year-per-bit' | 'year-per-byte' | 'year-per-celsius' | 'year-per-centimeter' | 'year-per-day'
    | 'year-per-degree' | 'year-per-fahrenheit' | 'year-per-fluid-ounce' | 'year-per-foot' | 'year-per-gallon'
    | 'year-per-gigabit' | 'year-per-gigabyte' | 'year-per-gram' | 'year-per-hectare' | 'year-per-hour'
    | 'year-per-inch' | 'year-per-kilobit' | 'year-per-kilobyte' | 'year-per-kilogram' | 'year-per-kilometer'
    | 'year-per-liter' | 'year-per-megabit' | 'year-per-megabyte' | 'year-per-meter' | 'year-per-mile'
    | 'year-per-mile-scandinavian' | 'year-per-millimeter' | 'year-per-milliliter' | 'year-per-millisecond'
    | 'year-per-minute' | 'year-per-month' | 'year-per-ounce' | 'year-per-percent' | 'year-per-petabyte'
    | 'year-per-pound' | 'year-per-second' | 'year-per-stone' | 'year-per-terabit' | 'year-per-terabyte'
    | 'year-per-week' | 'year-per-yard' | 'year-per-year';

/**
 * Relative time units.
 */
export type NativeRelativeTimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

/**
 * Relative time units, including special `'auto'` unit.
 */
export type RelativeTimeUnit = NativeRelativeTimeUnit | 'auto';

/**
 * Format part types.
 */
// prettier-ignore
export type FormatPartType =
    | 'literal'  | 'currency'     | 'decimal' | 'fraction'  | 'group' | 'infinity' | 'integer' | 'minusSign' | 'nan'
    | 'plusSign' | 'percentSign'  | 'day'     | 'dayPeriod' | 'era'   | 'hour'     | 'minute'  | 'month'
    | 'second'   | 'timeZoneName' | 'weekday' | 'year'      | 'string';

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
    readonly transform?: (string: string, parts: readonly FormatPart[], locale: string) => MessageStatic<M>;

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
    readonly zero?: MessageStatic<M>;
    readonly one?: MessageStatic<M>;
    readonly two?: MessageStatic<M>;
    readonly few?: MessageStatic<M>;
    readonly many?: MessageStatic<M>;
    readonly other: MessageStatic<M>;
    readonly [match: string]: MessageStatic<M>;
    readonly [match: number]: MessageStatic<M>;
}

/**
 * Token of formatted string.
 */
export interface FormatPart {
    readonly type: FormatPartType;
    readonly value: string;
}

/**
 * Formatted value wrapper type.
 */
export interface Formatted<M> extends ReadonlyArray<MessageStatic<M>> {
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
     */
    readonly update: (value: unknown) => Formatted<M>;

    /**
     * Updates options.
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

    readonly select: (table: FormatTable<M>) => MessageStatic<M>;

    readonly result: MessageStatic<M>;
    readonly format: unknown;
}
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

    let result: MessageStatic<M>;
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
        result,
        format,

        update,
        configure,

        number,
        string,
        date: new Date(number),
        toString,
        [Symbol.toPrimitive]: toString,
        select,
    });
};
// endregion Format
