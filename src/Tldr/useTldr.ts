import { createContext, ReactNode, useCallback, useContext } from 'react';
import { useStore } from '../Store';
import { createTldr } from './Tldr';
import { MessageArg, translate } from './Translate';

const TldrContext = createContext(createTldr<ReactNode>('en', {}));

TldrContext.displayName = 'Tldr';

export const useTldr = () => {
    const store = useContext(TldrContext);
    const state = useStore(store);
    const { actions } = store;

    const tl = translate(state);

    const $ = useCallback(
        (ss: TemplateStringsArray, ...xs: readonly MessageArg<ReactNode>[]) => {
            return tl(ss, ...xs);
        },
        [tl],
    );

    return { ...state, ...actions, $ } as const;
};

export const TldProvider = TldrContext.Provider;
