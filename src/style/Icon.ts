import * as Color from './Color'

import * as Html from '../utils/vdom/Html'

import * as Layout from '../utils/layout/Layout'


export function button<A>(attributes: Array<Html.Attribute<A>>, icon: Html.Html<never>): Layout.Layout<A> {
    return Layout.column(
        "button",
        [
            Html.style("width", "16px"),
            Html.style("height", "16px"),
            Html.style("border-radius", "50%"),
            Html.style("align-items", "center"),
            Html.style("justify-content", "center"),
            Html.style("background-color", Color.toCssString(Color.gray100)),
            ...attributes
        ],
        [
            Layout.fromHtml(icon, {})
        ]
    )
}

export function play<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "media-play.svg"),
            Html.attribute("width", "8"),
            Html.attribute("height", "8"),
        ],
        []
    )
}

export function delete_<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "trash.svg"),
            Html.attribute("width", "8"),
            Html.attribute("height", "8"),
        ],
        []
    )
}

export function options<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "ellipses.svg"),
            Html.attribute("width", "8"),
            Html.attribute("height", "8"),
        ],
        []
    )
}

export function chevronUp<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "chevron-top.svg"),
            Html.attribute("width", "8"),
            Html.attribute("height", "8"),
        ],
        []
    )
}

export function chevronDown<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "chevron-bottom.svg"),
            Html.attribute("width", "8"),
            Html.attribute("height", "8"),
        ],
        []
    )
}
