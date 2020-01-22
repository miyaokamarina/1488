import { hsla } from '@ripreact/hsl';
import { rem } from '../Prelude';
import { ColorsDefinition, HslaDefinition, SlaDefinition, ThemeDefinition } from './Definitions';
import { ColorVariables, ThemeVariables } from './Variables';

const hslaTuple = (color: HslaDefinition) => hsla(color.h, color.s, color.l, color.a ?? 1);
const slaTuple = (h: number, color: SlaDefinition) => hsla(h, color.s, color.l, color.a ?? 1);

export interface ThemeMedia {
    readonly touch: boolean;
    readonly keyboard: boolean;
    readonly width: number;
}

export interface ThemeOptions {
    readonly level: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    readonly heading: boolean;
    readonly block: 0 | 1 | 2;
    readonly large: 0 | 1 | 2;
    readonly small: boolean;
    readonly ui: boolean;
    readonly code: boolean;
    readonly bold: boolean;
    readonly interactive: boolean;
    readonly color: 'main' | 'primary' | 'secondary' | 'link' | 'visited' | 'info' | 'success' | 'warning' | 'error';
    readonly even: boolean;
    readonly ambient: boolean;
}

const resolveColorVariables = (definition: ColorsDefinition, media: ThemeMedia, options: ThemeOptions): ColorVariables => {
    const page = hslaTuple(definition.pageBackground);

    if (options.color === 'main') {
        const colors = options.ambient ? definition.mainAmbientColors : definition.mainColors;
        const background = options.even ? colors.even : colors.background;

        return {
            '--page': page,
            '--background': hslaTuple(background),
            '--foreground': hslaTuple(colors.foreground),
            '--backdrop': hslaTuple(colors.backdrop),
            '--focus': media.keyboard ? hslaTuple(colors.focus) : 'transparent',
            '--hover': hslaTuple(colors.hover),
            '--active': hslaTuple(colors.active),
            '--glow': hslaTuple(colors.glow),
        };
    }

    const colors = options.ambient ? definition.codeAmbientColors : definition.codeColors;
    const background = options.even ? colors.even : colors.background;
    const hue = definition.codeHues[options.color];

    return {
        '--page': page,
        '--background': slaTuple(hue, background),
        '--foreground': slaTuple(hue, colors.foreground),
        '--backdrop': slaTuple(hue, colors.backdrop),
        '--focus': media.keyboard ? slaTuple(hue, colors.focus) : 'transparent',
        '--hover': slaTuple(hue, colors.hover),
        '--active': slaTuple(hue, colors.active),
        '--glow': slaTuple(hue, colors.glow),
    };
};

export const resolveVariables = (definition: ThemeDefinition, media: ThemeMedia, options: ThemeOptions): ThemeVariables => {
    let base = definition.baseScale;

    base *= definition.adaptiveScale[media.width];

    if (options.small) /*                      */ base *= definition.smallScale;
    if (options.large === 1) /*                */ base *= definition.largeScale;
    else if (options.large === 2) /*           */ base *= definition.largerScale;
    if (options.interactive && media.touch) /* */ base *= definition.interactiveScale;
    if (options.heading && options.level) /*   */ base *= definition.headingScale ** (-options.level + 7);
    if (!options.ui) /*                        */ base *= definition.proseScale;

    const font = options.code ? definition.codeFont : options.ui ? definition.uiFont : definition.proseFont;

    return {
        '--base': rem(base),
        '--font': rem(base * 0.65),
        '--small': rem(base * 0.5),
        '--smaller': rem(base * 0.25),
        '--rounding': rem(base * 0.15),
        '--outline': rem(Math.max(base * 0.1, 0.125)),
        '--border': rem(Math.max(base * 0.05, 0.125)),

        '--family': font.family,
        '--weight': options.bold ? font.boldWeight : font.regularWeight,

        ...resolveColorVariables(definition, media, options),
    };
};
