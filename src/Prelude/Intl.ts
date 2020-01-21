import { createContext, ReactNode, useCallback, useContext } from 'react';
import { Store, useStore } from './Store';
import { Message, MessageArg, translate } from './Translate';

// region Symbols
export const displayName = Symbol('displayName');
export const languageTag = Symbol('languageTag');
// endregion Symbols

// region State
/**
 * Dictionary of messages of specific locale.
 */
export interface Locale<M> {
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
    readonly [id: string]: Message<M>;
}

/**
 * Dictionary of locales.
 */
export interface Library<M> {
    /**
     * Key-value locales definitions, where keys are language tags.
     */
    readonly [id: string]: Locale<M>;
}

/**
 * Type used to describe internal state of internationalization context.
 */
export interface IntlState<M> {
    /**
     * Active language tag.
     */
    readonly locale: string;

    /**
     * Active library.
     */
    readonly library: Library<M>;
}

/**
 * Actions to change internationalization state.
 */
export type IntlActions<M> = {
    /**
     * Adds locales to state.
     */
    readonly addLocales: (state: IntlState<M>, update: Library<M>) => IntlState<M>;

    /**
     * Switches active locale.
     */
    readonly setLocale: (state: IntlState<M>, locale: string) => IntlState<M>;
};
// endregion State

// region Public helpers
const setLocale = <M>(state: IntlState<M>, locale: string): IntlState<M> => ({
    ...state,
    locale,
});

const addLocales = <M>(state: IntlState<M>, update: Library<M>): IntlState<M> => ({
    ...state,
    library: {
        ...state.library,
        ...update,
    },
});

export const createIntl = <M>(locale: string, library: Library<M>) => {
    return new Store({ locale, library } as IntlState<M>, { setLocale, addLocales } as IntlActions<M>);
};

const IntlContext = createContext(createIntl<ReactNode>('en', {}));

export const useIntl = () => {
    const store = useContext(IntlContext);
    const state = useStore(store);
    const { actions } = store;

    const $ = useCallback(
        (ss: TemplateStringsArray, ...xs: readonly MessageArg<ReactNode>[]) => {
            return translate(state)(ss, ...xs);
        },
        [state],
    );

    return { ...state, ...actions, $ } as const;
};

export const IntlProvider = IntlContext.Provider;
// endregion Public helpers
