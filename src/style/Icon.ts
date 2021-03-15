import * as Html from '../utils/vdom/Html'
import * as Color from './Color'

// https://feathericons.com/

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
