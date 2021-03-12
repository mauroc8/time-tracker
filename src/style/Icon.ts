import * as Html from '../utils/vdom/Html'
import * as Color from './Color'

// I use icons.mono.company

export function play<A>(color: Color.Color): Html.Html<A> {
    return Html.node(
        "sgv",
        [
            Html.attribute("xmlns", "http://www.w3.org/2000/svg"),
            Html.attribute("fill", "none"),
            Html.attribute("viewBox", "0 0 24 24"),
            Html.attribute("width", "24"),
            Html.attribute("height", "24"),
            Html.style("width", "24px"),
            Html.style("height", "24px"),
        ],
        [
            Html.node(
                "path",
                [
                    Html.attribute("xmlns", "http://www.w3.org/2000/svg"),
                    Html.attribute("d", "M6 6.74105C6 5.19747 7.67443 4.23573 9.00774 5.01349L18.0231 10.2725C19.3461 11.0442 19.3461 12.9558 18.0231 13.7276L9.00774 18.9865C7.67443 19.7643 6 18.8026 6 17.259V6.74105ZM17.0154 12L8 6.74105V17.259L17.0154 12Z"),
                    Html.attribute("fill", Color.toCssString(color)),
                ],
                []
            )
        ]
    )
}

export function delete_<A>(color: Color.Color): Html.Html<A> {
    return Html.node(
        "sgv",
        [
            Html.attribute("xmlns", "http://www.w3.org/2000/svg"),
            Html.attribute("fill", "none"),
            Html.attribute("viewBox", "0 0 24 24"),
            Html.attribute("width", "24"),
            Html.attribute("height", "24"),
            Html.style("width", "24px"),
            Html.style("height", "24px"),
        ],
        [
            Html.node(
                "path",
                [
                    Html.attribute("xmlns", "http://www.w3.org/2000/svg"),
                    Html.attribute("d", "M7 4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V6H18.9897C18.9959 5.99994 19.0021 5.99994 19.0083 6H21C21.5523 6 22 6.44772 22 7C22 7.55228 21.5523 8 21 8H19.9311L19.0638 20.1425C18.989 21.1891 18.1182 22 17.0689 22H6.93112C5.88184 22 5.01096 21.1891 4.9362 20.1425L4.06888 8H3C2.44772 8 2 7.55228 2 7C2 6.44772 2.44772 6 3 6H4.99174C4.99795 5.99994 5.00414 5.99994 5.01032 6H7V4ZM9 6H15V4H9V6ZM6.07398 8L6.93112 20H17.0689L17.926 8H6.07398Z"),
                    Html.attribute("fill", Color.toCssString(color)),
                ],
                []
            )
        ]
    )
}

export function options<A>(color: Color.Color): Html.Html<A> {
    return Html.node(
        "sgv",
        [
            Html.attribute("xmlns", "http://www.w3.org/2000/svg"),
            Html.attribute("fill", "none"),
            Html.attribute("viewBox", "0 0 24 24"),
            Html.attribute("width", "24"),
            Html.attribute("height", "24"),
            Html.style("width", "24px"),
            Html.style("height", "24px"),
        ],
        [
            Html.node(
                "path",
                [
                    Html.attribute("xmlns", "http://www.w3.org/2000/svg"),
                    Html.attribute("d", "M10 12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12Z"),
                    Html.attribute("fill", Color.toCssString(color)),
                ],
                []
            ),
            Html.node(
                "path",
                [
                    Html.attribute("xmlns", "http://www.w3.org/2000/svg"),
                    Html.attribute("d", "M10 6C10 7.10457 10.8954 8 12 8C13.1046 8 14 7.10457 14 6C14 4.89543 13.1046 4 12 4C10.8954 4 10 4.89543 10 6Z"),
                    Html.attribute("fill", Color.toCssString(color)),
                ],
                []
            ),
            Html.node(
                "path",
                [
                    Html.attribute("xmlns", "http://www.w3.org/2000/svg"),
                    Html.attribute("d", "M10 18C10 19.1046 10.8954 20 12 20C13.1046 20 14 19.1046 14 18C14 16.8954 13.1046 16 12 16C10.8954 16 10 16.8954 10 18Z"),
                    Html.attribute("fill", Color.toCssString(color)),
                ],
                []
            ),
        ]
    )
}
