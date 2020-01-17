import { IconTheme } from '../Icons';

export interface Theme extends Grids, Fonts, Palettes, Media, Icons {
    readonly id: string;
}

export interface Grids {
    readonly s: Grid;
    readonly i: Grid;
}

export interface Grid {
    readonly [Symbol.toPrimitive]: () => number;

    readonly regular: number;

    readonly s: number;
    readonly xs: number;
    readonly xxs: number;
    readonly xxxs: number;

    readonly l: number;
    readonly xl: number;
    readonly xxl: number;
}

export interface Fonts {
    readonly height: number;

    readonly ui: Font;
    readonly text: Font;
    readonly code: Font;
}

export interface Font {
    readonly family: string;
    readonly size: number;
    readonly weight: number;
    readonly bold: number;
}

export interface Palettes {
    readonly regular: Palette;
    readonly plain: Palette;
}

export interface Palette {
    readonly backdrop: string;
    readonly focus: string;
    readonly active: string;
    readonly hover: string;
    readonly even: string;
    readonly glow: string;
    readonly bg: string;
    readonly fg: string;
}

export interface Media {
    readonly controlKeyboard: boolean;
    readonly controlHover: boolean;
    readonly controlTouch: boolean;
    readonly scrollbarsVisible: boolean;
    readonly print: boolean;
    readonly size: Size;
}

export type Size = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Icons {
    readonly iconsBase: string;
    readonly iconsTheme: IconTheme;
}

export interface ThemeConfig extends GridsConfig, FontsConfig {
    readonly id: string;
}

export interface GridsConfig {
    readonly s: GridConfig;
    readonly i: GridConfig;
}

export interface GridConfig {
    readonly unsupported: number;
    readonly nano: number;
    readonly micro: number;
    readonly mini: number;
    readonly small: number;
    readonly medium: number;
    readonly large: number;
    readonly lunatic: number;
    readonly extra: number;
    readonly phantasm: number;
}

export interface FontsConfig {
    readonly scale: number;
    readonly base: number;
    readonly thin: number;
    readonly bold: number;
    readonly bolder: number;

    readonly ui: FontConfig;
    readonly text: FontConfig;
    readonly code: FontConfig;
}

export interface FontConfig {
    //
}
