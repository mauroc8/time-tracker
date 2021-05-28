import * as Html from '../vdom/Html'
import * as Layout from '../layout/Layout'
import * as Css from '../layout/Css'
import * as Color from './Color'

const textInputCss: Css.Css = {
    "label": {
        "font-size": "14px",
        "letter-spacing": "0.08em",
        "font-weight": "500"
    },
    "input": {
        "background-color": Color.toCssString(Color.hsl(0, 0, 0.05)),
        "color": Color.toCssString(Color.hsl(0, 0, 1)),
        "font-size": "14px",
        "letter-spacing": "0.04em",
        "font-weight": "300",
        "line-height": "38px",
        "padding-left": "8px",
        "padding-right": "8px",
    },
    "input:focus": {
        "background-color": Color.toCssString(Color.hsl(0, 0, 0)),
        "outline": "0",
    }
}

export function textInput<A>(
    attributes: Array<Html.Attribute<A>>,
    args: {
        id: string,
        label: Layout.Layout<A>,
        value: string,
        attributes: Array<Html.Attribute<A>>,
    }
): Layout.Layout<A> {
    return Layout.withCss(
        textInputCss,
        Layout.columnWithSpacing(
            14,
            "label",
            [
                Html.attribute("for", args.id),
                Html.style("width", "100%"),
                Html.style("height", "100%"),
                ...attributes,
            ],
            [
                args.label,
                Layout.column(
                    "input",
                    [
                        Html.attribute("id", args.id),
                        Html.attribute("value", args.value),
                        Html.style("width", "100%"),
                        Html.style("height", "100%"),
                        Html.style("border-radius", "5px"),
                        ...args.attributes,
                    ],
                    []
                )
            ]
        )
    )
}

export function button<A>(
    attributes: Array<Html.Attribute<A>>,
    args: {
        onClick: (event: any) => A,
        label: Layout.Layout<A>,
    }
): Layout.Layout<A> {
    return Layout.column(
        "button",
        [
            Html.on("click", args.onClick),
            ...attributes
        ],
        [args.label]
    )
}
