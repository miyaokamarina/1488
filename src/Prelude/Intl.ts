import { ReactNode, useState, createElement, useContext, createContext } from 'react';
import { logger } from './Logger';
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
// endregion State

// region Public helpers
/**
 * Internationalization context type.
 */
export interface IntlContext extends IntlState<ReactNode> {
    /**
     * Adds locales to state.
     */
    readonly addLocales: (update: Library<ReactNode>) => void;

    /**
     * Switches active locale.
     */
    readonly setLocale: (locale: string) => void;
}

/**
 * Internationalization provider props.
 */
export interface IntlProviderProps {
    /**
     * Initial locale.
     */
    readonly locale: string;

    /**
     * Initial library.
     */
    readonly library: Library<ReactNode>;

    /**
     * Subtree.
     */
    readonly children?: ReactNode;
}

/**
 * Provides internationalization state.
 *
 * @param state Initial state.
 * @param children Children nodes.
 */
export const IntlProvider = ({ locale, library, children }: IntlProviderProps) => {
    const [value, setState]: [IntlContext, (context: IntlContext) => unknown] = useState<IntlContext>({
        locale,
        library,
        addLocales: update => {
            logger.trace`intl:updating`('%o', update);

            Promise.resolve().then(() => {
                return setState({
                    ...value,
                    library: {
                        ...value.library,
                        ...update,
                    },
                });
            });
        },
        setLocale: locale => {
            logger.trace`intl:switching`('%o', locale);

            Promise.resolve().then(() => {
                return setState({
                    ...value,
                    locale,
                });
            });
        },
    });

    return createElement(IntlContext.Provider, { value, children });
};

/**
 * React message translator tag.
 *
 * @param id Message identifier.
 */
export const $ = (ss: TemplateStringsArray, ...xs: readonly MessageArg<ReactNode>[]) => {
    return createElement(IntlContext.Consumer, { children: state => translate(state)(ss, ...xs) });
};

/**
 * React hook for internationalization context. Useful when you need to get
 * locale setter function.
 */
export const useIntl = () => useContext(IntlContext);

const IntlContext = createContext<IntlContext>({
    locale: 'en-us',
    library: {},
    setLocale: () => {},
    addLocales: () => {},
});
// endregion Public helpers
