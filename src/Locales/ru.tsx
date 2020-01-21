import { ReactNode } from 'react';
import { displayName, languageTag, Translation } from '../Tldr/Tldr';
import { en } from './en';

export const ru: Translation<ReactNode> = {
    ...en,
    [displayName]: 'Русский',
    [languageTag]: 'ru-ru',
    'Hello!': 'Здрасьте!',
    'You sucked {} times.': n => {
        return n.select({
            0: (
                <>
                    <em>Вы</em> не соснули.
                </>
            ),
            1: (
                <>
                    <em>Вы</em> соснули разулю.
                </>
            ),
            2: (
                <>
                    <em>Вы</em> соснули дважды.
                </>
            ),
            3: (
                <>
                    <em>Вы</em> соснули трижды.
                </>
            ),
            few: (
                <>
                    <em>Вы</em> соснули {n} раза.
                </>
            ),
            other: (
                <>
                    <em>Вы</em> соснули {n} раз.
                </>
            ),
        });
    },
};
