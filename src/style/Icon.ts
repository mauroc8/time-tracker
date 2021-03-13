import * as Html from '../utils/vdom/Html'
import * as Color from './Color'

// https://feathericons.com/

export function play<A>(): Html.Html<A> {
    return Html.node(
        "svg",
        [
            Html.attribute("xmlns", "http://www.w3.org/2000/svg"),
            Html.attribute("width", "24"),
            Html.attribute("height", "24"),
            Html.attribute("viewBox", "0 0 24 24"),
            Html.attribute("fill", "none"),
            Html.attribute("stroke", "currentColor"),
            Html.attribute("stroke-width", "2"),
            Html.attribute("stroke-linecap", "round"),
            Html.attribute("stroke-linejoin", "round"),
        ],
        [
            Html.node(
                "polygon",
                [
                    Html.attribute("points", "5 3 19 12 5 21 5 3")
                ],
                []
            )
        ]
    )
}

export function delete_<A>(): Html.Html<A> {
    return Html.node(
        "svg",
        [
            Html.attribute("xmlns", "http://www.w3.org/2000/svg"),
            Html.attribute("width", "24"),
            Html.attribute("height", "24"),
            Html.attribute("viewBox", "0 0 24 24"),
            Html.attribute("fill", "none"),
            Html.attribute("stroke", "currentColor"),
            Html.attribute("stroke-width", "2"),
            Html.attribute("stroke-linecap", "round"),
            Html.attribute("stroke-linejoin", "round"),
        ],
        [
            Html.node(
                "polyline",
                [
                    Html.attribute("points", "3 6 5 6 21 6"),
                ],
                []
            ),
            Html.node(
                "path",
                [
                    Html.attribute("d", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"),
                ],
                []
            )
        ]
    )
}

export function options<A>(): Html.Html<A> {
    return Html.node(
        "svg",
        [
            Html.attribute("xmlns", "http://www.w3.org/2000/svg"),
            Html.attribute("width", "24"),
            Html.attribute("height", "24"),
            Html.attribute("viewBox", "0 0 24 24"),
            Html.attribute("fill", "none"),
            Html.attribute("stroke", "currentColor"),
            Html.attribute("stroke-width", "2"),
            Html.attribute("stroke-linecap", "round"),
            Html.attribute("stroke-linejoin", "round"),
        ],
        [
            Html.node(
                "circle",
                [
                    Html.attribute("cx", "12"),
                    Html.attribute("cy", "12"),
                    Html.attribute("r", "1"),
                ],
                []
            ),
            Html.node(
                "circle",
                [
                    Html.attribute("cx", "12"),
                    Html.attribute("cy", "5"),
                    Html.attribute("r", "1"),
                ],
                []
            ),
            Html.node(
                "circle",
                [
                    Html.attribute("cx", "12"),
                    Html.attribute("cy", "19"),
                    Html.attribute("r", "1"),
                ],
                []
            ),
        ]
    )
}
