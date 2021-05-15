import * as Html from "./vdom/Html"

export type ViewConfig = {
    mode: 'normal' | 'zen',
}

export function of<A extends ViewConfig>(a: A): ViewConfig {
    return a
}

export function isZenMode(viewConfig: ViewConfig): boolean {
    return viewConfig.mode === 'zen'
}
