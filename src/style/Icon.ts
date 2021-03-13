import * as Html from '../utils/vdom/Html'
import * as Color from './Color'

// https://feathericons.com/

export function play<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "play.svg"),
            Html.attribute("width", "16"),
            Html.attribute("height", "16"),
        ],
        []
    )
}

export function delete_<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "trash.svg"),
            Html.attribute("width", "16"),
            Html.attribute("height", "16"),
        ],
        []
    )
}

export function options<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "kebab-horizontal.svg"),
            Html.attribute("width", "16"),
            Html.attribute("height", "16"),
        ],
        []
    )
}
