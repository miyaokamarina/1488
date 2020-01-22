/**
 * Resolved theme variables.
 */
export interface ThemeVariables extends DimensionVariables, FontVariables, ColorVariables {}

/**
 * Resolved basic dimensions.
 */
export interface DimensionVariables {
    /**
     * E.g., `'20px'`.
     */
    readonly '--base': string;

    /**
     * {@link DimensionVariables.base} × 0.65; e.g., `'13px'`.
     */
    readonly '--font': string;

    /**
     * {@link DimensionVariables.base} × 0.5; e.g., `'10px'`.
     */
    readonly '--small': string;

    /**
     * {@link DimensionVariables.base} × 0.25; e.g., `'5px'`.
     */
    readonly '--smaller': string;

    /**
     * {@link DimensionVariables.base} × 0.15; e.g., `'3px'`.
     */
    readonly '--rounding': string;

    /**
     * {@link DimensionVariables.base} × 0.1; e.g., `'2px'`.
     */
    readonly '--outline': string;

    /**
     * {@link DimensionVariables.base} × 0.05; e.g., `'1px'`.
     */
    readonly '--border': string;
}

/**
 * Resolved font parameters.
 */
export interface FontVariables {
    /**
     * Font family.
     */
    readonly '--family': string;

    /**
     * Font weight.
     */
    readonly '--weight': number;
}

/**
 * Resolved color parameters.
 *
 * Depends on contexts:
 *
 * -   color code context (× 6),
 * -   is print context.
 *
 * Depends on parameters:
 *
 * -   is interactive (× 2),
 * -   is plain (× 2).
 */
export interface ColorVariables {
    /**
     * Backdrop color.
     */
    readonly '--backdrop': string;

    /**
     * Focus outline color.
     */
    readonly '--focus': string;

    /**
     * Active element background.
     */
    readonly '--active': string;

    /**
     * Hovered element background.
     */
    readonly '--hover': string;

    /**
     * Glow color.
     */
    readonly '--glow': string;

    /**
     * Regular background.
     */
    readonly '--background': string;

    /**
     * Foreground color.
     */
    readonly '--foreground': string;

    /**
     * Page background color.
     */
    readonly '--page': string;
}
