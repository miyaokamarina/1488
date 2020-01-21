import { ReactNode } from 'react';
import { render } from 'react-dom';
import { hsl } from '@ripreact/hsl';

import { en, ru } from './Locales';
import { createIntl, displayName, IntlProvider, Store, useIntl, useStore } from './Prelude';

import styles from './index.css';

const store = new Store(1, {
    dec: state => state - 1,
    inc: state => state + 1,
    min: () => 0,
    max: () => 12309,
});

const { dec, inc, min, max } = store.actions;

const intl = createIntl<ReactNode>('en', { en, ru });

const Setup = ({ children }: { readonly children: ReactNode }) => {
    return <IntlProvider value={intl}>{children}</IntlProvider>;
};

const App = () => {
    const state = useStore(store);
    const { locale, library, setLocale, $ } = useIntl();

    return (
        <div style={{ '--main-color': hsl(state * 10, 100, 50), '--accent-color': hsl(state * 10 + 180, 100, 50) }}>
            <div className='pidor'>
                <span>Ti Xyi))0)</span>
            </div>
            <div>
                {$`Hello!`} {$`You sucked ${state} times.`}
            </div>
            <div>
                <button onClick={dec}>-</button>
                <button onClick={inc}>+</button>
                <button onClick={min}>0</button>
                <button onClick={max}>12309</button>
            </div>
            <div>
                {Object.entries(library).map(([key, { [displayName]: name }]) => {
                    return (
                        <button key={key} onClick={() => setLocale(key)}>
                            {locale == key ? '• ' : null} {name}
                        </button>
                    );
                })}
            </div>
            <style jsx>{styles}</style>
        </div>
    );
};

render(
    <Setup>
        <App />
    </Setup>,
    document.querySelector('#root')!,
);
