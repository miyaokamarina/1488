import { ReactNode } from 'react';
import { render } from 'react-dom';
import css from 'styled-jsx/css';
import { hsl } from '@ripreact/hsl';

import { en, ru } from './Locales';
import { $, displayName, IntlProvider, logger, Store, useActions, useIntl, useStore, csym, cvar } from './Prelude';

const store = Store`main`(1, {
    dec: state => state - 1,
    inc: state => state + 1,
    min: () => 0,
    max: () => 14_88,
});

const Setup = ({ children }: { readonly children: ReactNode }) => {
    return (
        <IntlProvider locale='en' library={{ en, ru }}>
            {children}
        </IntlProvider>
    );
};

const mainColor = csym`mainColor`;
const accentColor = csym`accentColor`;

const App = () => {
    const state = useStore(store);
    const { dec, inc, min, max } = useActions(store);
    const { locale, library, setLocale } = useIntl();

    return (
        <div style={{ [mainColor]: hsl(state * 10, 100, 50), [accentColor]: hsl(-state * 10, 100, 50) }}>
            <div className='pidor'>Ti Xyi))0)</div>
            <div>
                {$`Hello!`} {$`You sucked ${state} times.`}
            </div>
            <div>
                <button onClick={dec}>-</button>
                <button onClick={inc}>+</button>
                <button onClick={min}>0</button>
                <button onClick={max}>1488</button>
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

const styles = css`
    div {
        background-color: ${cvar(mainColor)};
        color: #fff;
    }

    .pidor {
        background-color: ${cvar(accentColor)};
    }
`;

render(
    <Setup>
        <App />
    </Setup>,
    document.querySelector('#root')!,
);

logger.log`ti:pidor +da, pizda`('V zhope provoda.');
