// +---------------------+---------------------+-------------------------------------------+
// | Container           | Block               | Inline                                    |
// |                     |                     |                                           |
// | May include         | Only may include    | Only may include                          |
// | containers, blocks, | inlines, or         | inlines.                                  |
// | and inlines.        | restricted set of   |                                           |
// |                     | other elements.     |                                           |
// |                     |                     |                                           |
// +---------------------+---------------------+---------------------+---------------------+---------------------+
// | Section             | P                   | Restricted          | Adaptive            | Prose               |
// | Li                  | Ul                  |                     |                     |                     |
// |                     | Ol                  | Only may be         | May be included in  |                     |
// |                     | Figure              | included in prose.  | prose and UI.       |                     |
// |                     | ProseTable          |                     |                     |                     |
// |                     | H                   +---------------------+---------------------+                     |
// |                     |                     | Footnote            | Em                  |                     |
// |                     |                     |                     | Small               |                     |
// |                     |                     |                     |                     |                     |
// +---------------------+---------------------+---------------------+---------------------+---------------------+
// | Frame               | Tree                | Active              | Static              | UI                  |
// |                     |                     |                     |                     |                     |
// |                     |                     | Only may include    | Only may include    |                     |
// |                     |                     | adaptive inline     | adaptive inline     |                     |
// |                     |                     | prose.              | prose.              |                     |
// |                     |                     |                     |                     |                     |
// |                     |                     +---------------------+---------------------+                     |
// |                     |                     | Label               | Button              |                     |
// |                     |                     | Progress            | Slider              |                     |
// |                     |                     |                     |                     |                     |
// |                     |                     |                     |                     |                     |
// +---------------------+---------------------+---------------------+---------------------+---------------------+

// H — may not include UI inlines.
// UI containers switch context to UI.
// Prose containers switch context to prose.
// Default context is UI.

// Non-parametric media watchers created at module load.
// Parametric media watcher created at theme instantiation.
// Theme Provider: When theme activated, it subscribes to media watchers and changes state according to received events.

// Context 1: Provides active theme instance and theme instances library; switches themes; internal.
// Context 2: Provides media state; internal.
// Context 3: Provides contextual info; almost public.

export interface ThemeLibrary {
    readonly [is: string]: ThemeDefinition;
}

export interface ThemeLibraryContext {
    readonly theme: string;
    readonly library: ThemeLibrary;
}

export interface ThemeMediaContext {
    readonly adaptive: number;
    readonly control: ThemeControl;
    readonly print: boolean;
}
