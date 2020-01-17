import { ReactNode } from 'react';
import { displayName, languageTag, Locale } from '../Prelude';

export const en: Locale<ReactNode> = {
    [displayName]: 'English',
    [languageTag]: 'en-us',
    // 'Hello!': 'Hello!',
    'You sucked {} times.': ([n]) => {
        return n.select({
            0: (
                <>
                    <em>You</em> didn’t suck.
                </>
            ),
            1: (
                <>
                    <em>You</em> sucked once.
                </>
            ),
            2: (
                <>
                    <em>You</em> sucked twice.
                </>
            ),
            other: (
                <>
                    <em>You</em> sucked {n} times.
                </>
            ),
        });
    },
};
