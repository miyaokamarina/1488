import { Store } from '../Store';
import { Formatted } from './Format';

// region Symbols
export const displayName = Symbol('displayName');
export const languageTag = Symbol('languageTag');
// endregion Symbols

// region Types
/**
 * Static message type.
 */
export type TranslationMessageStatic<M> = M | string | number | boolean | null | undefined | Formatted<M>;

/**
 * Dynamic (parametric) message type.
 *
 * @param params Iterator of formatted values. May yield more values than was
 * passed to `translateMessage` tag, but all “fake” values will be just a
 * formatted `NaN`s.
 */
export type TranslationMessageDynamic<M> = (...args: readonly Formatted<M>[]) => TranslationMessageStatic<M>;

/**
 * Message type.
 */
export type TranslationMessage<M> = TranslationMessageStatic<M> | TranslationMessageDynamic<M>;

/**
 * Dictionary of messages of specific locale.
 */
export interface Translation<M> {
    /**
     * Locale display name.
     */
    readonly [displayName]: string;

    /**
     * Locale language tag.
     */
    readonly [languageTag]: string;

    /**
     * All other fields are just key-value message translations, where keys are
     * message identifiers.
     */
    readonly [id: string]: TranslationMessage<M>;
}

/**
 * Dictionary of locales.
 */
export interface Translations<M> {
    /**
     * Key-value locales definitions, where keys are language tags.
     */
    readonly [id: string]: Translation<M>;
}

/**
 * Type used to describe internal state of internationalization context.
 */
export interface TldState<M> {
    /**
     * Active language tag.
     */
    readonly locale: string;

    /**
     * Active library.
     */
    readonly library: Translations<M>;
}

/**
 * Actions to change internationalization state.
 */
export type TldActions<M> = {
    /**
     * Adds locales to state.
     */
    readonly addLocales: (state: TldState<M>, update: Translations<M>) => TldState<M>;

    /**
     * Switches active locale.
     */
    readonly setLocale: (state: TldState<M>, locale: string) => TldState<M>;
};
// endregion Types

// region tld/r
const setLocale = <M>(state: TldState<M>, locale: string): TldState<M> => ({
    ...state,
    locale,
});

const addLocales = <M>(state: TldState<M>, update: Translations<M>): TldState<M> => ({
    ...state,
    library: {
        ...state.library,
        ...update,
    },
});

export const createTldr = <M>(locale: string, library: Translations<M>) => {
    return new Store({ locale, library } as TldState<M>, { setLocale, addLocales } as TldActions<M>);
};
// endregion tld/r
