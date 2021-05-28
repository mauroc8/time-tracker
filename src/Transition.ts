import * as Group from './DateGroup'
import * as Utils from './utils/Utils'

// --- CollapsingTransition

export type Collapsing =
    | { tag: "idle" }
    | { tag: "aboutToCollapse", group: Group.Tag, height: number }
    | { tag: "collapsing", group: Group.Tag }

export function collapsingIdle(): Collapsing {
    return { tag: "idle" }
}

export function aboutToCollapse(group: Group.Tag, height: number): Collapsing {
    return { tag: 'aboutToCollapse', group, height }
}

export function startCollapsing(collapsingTransition: Collapsing): Collapsing {
    switch (collapsingTransition.tag) {
        case 'idle':
        case 'collapsing':
            return collapsingTransition

        case 'aboutToCollapse':
            return { tag: 'collapsing', group: collapsingTransition.group }
    }
}

// --- Uncollapsing

export type Uncollapsing =
    | { tag: "notUncollapsing" }
    | { tag: "aboutToUncollapse", group: Group.Tag }

export function notUncollapsing(): Uncollapsing {
    return { tag: 'notUncollapsing' }
}

export function aboutToUncollapse(group: Group.Tag): Uncollapsing {
    return { tag: 'aboutToUncollapse', group }
}

export function isAboutToUncollapse(group: Group.Tag, uncollapsingTransition: Uncollapsing): boolean {
    return uncollapsingTransition.tag === 'aboutToUncollapse'
        && Utils.equals(group, uncollapsingTransition.group)
}
