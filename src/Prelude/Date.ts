// Some functions are based on `date-fns` and `ms`.

type TimeDiff = (a: Date, b: Date) => number;

export const isDate = (x: unknown): x is Date => x instanceof Date;

export const diffMilliseconds: TimeDiff = (a, b) => (a as any) - (b as any);
export const diffSeconds: TimeDiff = (a, b) => Math.trunc(diffMilliseconds(a, b) / 1000);
export const diffMinutes: TimeDiff = (a, b) => Math.trunc(diffSeconds(a, b) / 60);
export const diffHours: TimeDiff = (a, b) => Math.trunc(diffMinutes(a, b) / 60);

export const diffDays: TimeDiff = (a, b) => {
    const ad = resetDayToStart(a);
    const bd = resetDayToStart(b);

    return diff(
        a,
        b,
        Math.trunc((ad.getTime() - getTimeZoneOffset(ad) - (bd.getTime() - getTimeZoneOffset(bd))) / 86400000),
        getDate,
        setDate,
    );
};

export const diffWeeks: TimeDiff = (a, b) => Math.trunc(diffDays(a, b) / 7);

export const diffMonths: TimeDiff = (a, b) => {
    return diff(a, b, (getYear(a) - getYear(b)) * 12 + getMonth(a) - getMonth(b), getMonth, setMonth);
};

export const diffQuarters: TimeDiff = (a, b) => Math.trunc(diffMonths(a, b) / 3);

export const diffYears: TimeDiff = (a, b) => diff(a, b, getYear(a) - getYear(b), getYear, setFullYear);

export const ms = (ms: number) => {
    const abs = Math.abs(ms);

    if (abs >= d) return Math.round(ms / d) + 'd';
    if (abs >= h) return Math.round(ms / h) + 'h';
    if (abs >= m) return Math.round(ms / m) + 'm';
    if (abs >= s) return Math.round(ms / s) + 's';

    return ms + 'ms';
};

// region Internal
const s = 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;

const diff = (a: Date, b: Date, init: number, get: (d: Date) => number, set: (d: Date, n: number) => number) => {
    const diff = Math.abs(init);
    const s = Math.sign((a as any) - (b as any));
    const back = cloneDate(a);

    set(back, get(back) - s * diff);

    const adjust = Math.sign((back as any) - (b as any)) == -s;

    return s * (diff - (adjust as any)) || 0;
};

const resetDayToStart = (a: Date) => {
    const back = cloneDate(a);

    back.setHours(0, 0, 0, 0);

    return back;
};

const getTimeZoneOffset = (a: Date) => {
    const back = cloneDate(a);
    const base = back.getTimezoneOffset();

    back.setSeconds(0, 0);

    const ms = back.getTime() % 60000;

    return base * 60000 + ms;
};

const cloneDate = (d: Date) => {
    return new Date(d);
};

const getDate = (d: Date) => d.getDate();
const setDate = (d: Date, n: number) => d.setDate(n);
const getMonth = (d: Date) => d.getMonth();
const setMonth = (d: Date, n: number) => d.setMonth(n);
const getYear = (d: Date) => d.getFullYear();
const setFullYear = (d: Date, n: number) => d.setFullYear(n);
// endregion Internal
