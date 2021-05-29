import * as Html from '../vdom/Html'
import * as Layout from '../layout/Layout'
import './Component.css'

export function textInput<A, C>(
    attributes: Array<Layout.Attribute<A, C>>,
    args: {
        id: string,
        label: Layout.Layout<A, C>,
        value: string,
        attributes: Array<Html.Attribute<A>>,
    }
): Layout.Layout<A, C> {
    return Layout.columnWithSpacing(
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
}

export function button<A, C>(
    attributes: Array<Layout.Attribute<A, C>>,
    args: {
        onClick: (event: any) => A,
        label: Layout.Layout<A, C>,
    }
): Layout.Layout<A, C> {
    return Layout.column(
        "button",
        [
            Html.on("click", args.onClick),
            ...attributes
        ],
        [args.label]
    )
}
