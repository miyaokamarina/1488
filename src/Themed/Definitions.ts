/**
 * Theme definition.
 */
export interface ThemeDefinition extends DimensionsDefinition, FontsDefinition, ColorsDefinition {
    readonly id: string;
}

/**
 * Dimensions to use in theme.
 */
export interface DimensionsDefinition {
    /**
     * Most fundamental grid cell size in CSS `rem`.
     */
    readonly baseScale: number;

    /**
     * Scaling factor used to calculate heading dimensions.
     *
     * Heading dimensions are calculated using the formula _dₙ = b × sⁿ_, where
     *
     * -   _dₙ_ is calculated dimension,
     * -   _n_ is scale number (`[1, 6]`),
     * -   _b_ is {@link DimensionsDefinition.baseScale},
     * -   _s_ is this parameter.
     */
    readonly headingScale: number;

    /**
     * Scaling factor for small text (subscript, superscript).
     */
    readonly smallScale: number;

    /**
     * Scaling factor for large elements (e.g., large buttons).
     */
    readonly largeScale: number;

    /**
     * Scaling factor for larger elements (e.g., autistic large buttons on landings).
     */
    readonly largerScale: number;

    /**
     * Scaling factor for prose content.
     */
    readonly proseScale: number;

    /**
     * Scaling factor for interactive elements on touch devices.
     */
    readonly interactiveScale: number;

    /**
     * Adaptive scaling factors.
     */
    readonly adaptiveScale: AdaptiveScale;
}

/**
 * Adaptive scaling factors.
 */
export interface AdaptiveScale {
    /**
     * Key-value pairs, where key is minimum width, and value us scaling factor for this and greater width.
     */
    readonly [minimumWidth: number]: number;
}

/**
 * Font theme definition.
 */
export interface FontsDefinition {
    /**
     * Font for non-UI elements.
     */
    readonly proseFont: FontDefinition;

    /**
     * Font for UI elements.
     */
    readonly uiFont: FontDefinition;

    /**
     * Font for code elements.
     */
    readonly codeFont: FontDefinition;
}

/**
 * Font definition.
 */
export interface FontDefinition {
    /**
     * Font family.
     */
    readonly family: string;

    /**
     * Font weight to use as regular.
     */
    readonly regularWeight: number;

    /**
     * Font weight to use as bold.
     */
    readonly boldWeight: number;
}

export interface ColorsDefinition {
    readonly pageBackground: HslaDefinition;

    /**
     * Main colors of non-ambient interactive elements.
     */
    readonly mainColors: ColorDefinition<HslaDefinition>;

    /**
     * Main colors of non-interactive and ambient interactive elements.
     */
    readonly mainAmbientColors: ColorDefinition<HslaDefinition>;

    /**
     * S, L, A components of non-ambient interactive elements with color code.
     */
    readonly codeColors: ColorDefinition<SlaDefinition>;

    /**
     * S, L, A components of non-interactive and ambient interactive elements with color code.
     */
    readonly codeAmbientColors: ColorDefinition<SlaDefinition>;

    /**
     * H components of color codes.
     */
    readonly codeHues: HuesDefinition;
}

export interface ColorDefinition<a> {
    /**
     * Background color.
     */
    readonly background: a;

    /**
     * Foreground color.
     */
    readonly foreground: a;

    /**
     * Backdrop color.
     */
    readonly backdrop: a;

    /**
     * Active element highlight color.
     */
    readonly active: a;

    /**
     * Focus color. When focus is not visible, this color becomes transparent.
     */
    readonly focus: a;

    /**
     * Hovered element highlight color.
     */
    readonly hover: a;

    /**
     * Hover glow color.
     */
    readonly glow: a;

    /**
     * Even rows background color.
     */
    readonly even: a;
}

export type HuesDefinition = {
    readonly [color in ColorCode]: number;
};

export type ColorCode = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'link' | 'visited';

export interface HslaDefinition {
    readonly h: number;
    readonly s: number;
    readonly l: number;
    readonly a?: number;
}

export interface SlaDefinition {
    readonly s: number;
    readonly l: number;
    readonly a?: number;
}
