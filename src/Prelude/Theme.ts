export enum GridSize {
    smallest = -3,
    smaller = -2,
    small = -1,
    normal = 0,
    large = 1,
    larger = 2,
    largest = 3,
}

export enum FontSize {
    small = -1,
    regular = 0,
    h6 = 1,
    h5 = 2,
    h4 = 3,
    h3 = 4,
    h2 = 5,
    h1 = 6,
}

export enum FontType {
    text = 0,
    ui = 1,
    code = 2,
}

export enum ColorCode {
    primary = 0,
    secondary = 1,
    link = 2,
    visited = 3,
    success = 4,
    info = 5,
    warning = 6,
    error = 7,
}

export interface ThemeParams {
    readonly isInteractive?: boolean;
    readonly gridSize?: GridSize;
    readonly isBold?: boolean;
    readonly fontSize?: FontSize;
    readonly fontType?: FontType;
    readonly colorCode?: ColorCode;
    readonly isPlain?: boolean;
}

export interface Theme extends Grid, Font, Palette {
    readonly id: string;
}

export interface Grid {
    /**
     * Grid cell size.
     */
    readonly cell: string;
}

export interface Font {
    /**
     * Font family.
     */
    readonly family: string;

    /**
     * Line height.
     */
    readonly height: string;

    /**
     * Font size.
     */
    readonly size: string;

    /**
     * Font weight.
     */
    readonly weight: string;
}

export interface Palette {
    /**
     * Backdrop color.
     */
    readonly backdrop: string;

    /**
     * Focus outline color.
     */
    readonly focus: string;

    /**
     * Active element background.
     */
    readonly active: string;

    /**
     * Hovered element background.
     */
    readonly hover: string;

    /**
     * Even list/table row background.
     */
    readonly even: string;

    /**
     * Glow color.
     */
    readonly glow: string;

    /**
     * Regular background.
     */
    readonly background: string;

    /**
     * Foreground color.
     */
    readonly foreground: string;
}

export interface ThemeDefinition extends GridDefinition, FontsDefinition {
    readonly id: string;
}

export interface GridDefinition {
    readonly display: GridSizesDefinition;
    readonly interactive: GridSizesDefinition;
}

export interface GridSizesDefinition {
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

export interface FontsDefinition {
    readonly scale: number;
    readonly base: number;
    readonly thin: number;
    readonly bold: number;
    readonly bolder: number;

    readonly ui: FontDefinition;
    readonly text: FontDefinition;
    readonly code: FontDefinition;
}

export interface FontDefinition {
    //
}
