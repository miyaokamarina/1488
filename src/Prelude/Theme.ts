/**
 * Element content scaling factor.
 */
export enum DimensionsScale {
    /**
     * Subscript/superscript; TODO: e.g., `'#px'`.
     */
    SMALL = -1,

    /**
     * Regular elements; e.g., `'20px'`.
     */
    BASE = 0,

    /**
     * Large buttons; e.g., `'30px'`.
     */
    LARGE = 1,

    /**
     * Autistic large buttons; e.g., `'40px'`.
     */
    LARGER = 2,
}

/**
 * Color code.
 */
export enum ColorCode {
    /**
     * Regular elements.
     */
    primary = 0,

    /**
     * Secondary/accent elements.
     */
    secondary = 1,

    /**
     * Regular links.
     */
    link = 2,

    /**
     * Visited links.
     */
    visited = 3,

    /**
     * Success/OK elements.
     */
    success = 4,

    /**
     * Info elements.
     */
    info = 5,

    /**
     * Warning elements.
     */
    warning = 6,

    /**
     * Error elements.
     */
    error = 7,
}

/**
 * Theme consumer parameters.
 */
export interface ThemeParams {
    /**
     * Use {@link Dimensions} and {@link Colors} for interactive elements.
     *
     * Defaults to `false`.
     */
    readonly interactive?: boolean;

    /**
     * Use specific {@link Fonts}.
     *
     * Defaults to `false`.
     */
    readonly code?: boolean;

    /**
     * Use {@link Colors} for plain elements.
     */
    readonly plain?: boolean;
}

/**
 * Resolved theme parameters.
 */
export interface Theme extends Dimensions, Fonts, Colors {}

/**
 * Resolved basic dimensions.
 *
 * Depends on contexts:
 *
 * -   is prose context (× 2),
 * -   dimensions scale context (× 4),
 * -   nesting level context (× 6),
 * -   is heading context (× 2).
 *
 * Depends on parameters:
 *
 * -   is interactive (× 2).
 *
 * Depends on definitions:
 *
 * -   base,
 * -   scale.
 */
export interface Dimensions {
    /**
     * {@link Dimensions.base} × 0.05; e.g., `'1px'`.
     */
    readonly border: string;

    /**
     * {@link Dimensions.base} × 0.1; e.g., `'2px'`.
     */
    readonly outline: string;

    /**
     * {@link Dimensions.base} × 0.15; e.g., `'3px'`.
     */
    readonly rounding: string;

    /**
     * {@link Dimensions.base} × 0.25; e.g., `'5px'`.
     */
    readonly smaller: string;

    /**
     * {@link Dimensions.base} × 0.5; e.g., `'10px'`.
     */
    readonly small: string;

    /**
     * {@link Dimensions.base} × 0.65; e.g., `'13px'`.
     */
    readonly font: string;

    /**
     * {@link Dimensions.base} × 1; e.g., `'20px'`.
     */
    readonly base: string;
}

/**
 * Resolved font parameters.
 *
 * Depends on contexts:
 *
 * -   is prose context (× 2),
 * -   dimensions scale context (× 4),
 * -   nesting level context (× 6),
 * -   is heading context (× 2).
 * -   is bold context (× 2).
 *
 * Depends on parameters:
 *
 * -   is code (× 2).
 */
export interface Fonts {
    /**
     * Font family.
     */
    readonly family: string;

    /**
     * Font weight.
     */
    readonly weight: string;
}

/**
 * Resolved color parameters.
 */
export interface Colors {
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
    /**
     * Most fundamental grid cell size in rem.
     *
     * Defaults to `1.25`.
     */
    readonly base?: number;
}

export interface FontsDefinition {
    readonly scale: number;
    readonly regular: number;
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

export const buildTheme = (_: ThemeDefinition) => {
    //
};
