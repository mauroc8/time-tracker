import * as Color from './Color'

import * as Html from '../vdom/Html'

import * as Layout from '../layout/Layout'

export function wrapper<A, C>(
    htmlTag: string,
    attributes: Array<Layout.Attribute<A, C>>,
    icon: Html.Html<never>
): Layout.Layout<A, C> {
    return Layout.row(
        htmlTag,
        [
            Layout.centerX(),
            Layout.centerY(),
            Layout.widthPx(16),
            Layout.heightPx(16),
            Html.style("border-radius", "50%"),
            Layout.backgroundColor(Color.background),
            ...attributes
        ],
        [ icon ]
    )
}

export function button<A, C>(attributes: Array<Layout.Attribute<A, C>>, icon: Html.Html<never>): Layout.Layout<A, C> {
    return wrapper(
        "button",
        attributes,
        icon
    )
}

export function play<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "media-play.svg"),
            Layout.widthPx(8),
            Layout.heightPx(8),
        ],
        []
    )
}

export function delete_<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "trash.svg"),
            Layout.widthPx(8),
            Layout.heightPx(8),
        ],
        []
    )
}

export function options<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "ellipses.svg"),
            Layout.widthPx(8),
            Layout.heightPx(8),
        ],
        []
    )
}

export function chevronUp<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "chevron-top.svg"),
            Layout.widthPx(8),
            Layout.heightPx(8),
        ],
        []
    )
}

export function chevronDown<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "chevron-bottom.svg"),
            Layout.widthPx(8),
            Layout.heightPx(8),
        ],
        []
    )
}

export function chevronLeft<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "chevron-left.svg"),
            Layout.widthPx(8),
            Layout.heightPx(8),
        ],
        []
    )
}

export function chevronRight<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "chevron-right.svg"),
            Layout.widthPx(8),
            Layout.heightPx(8),
        ],
        []
    )
}
