import * as Html from '../utils/vdom/Html'
import * as Layout from '../utils/layout/Layout'
import * as Attribute from '../utils/layout/Attribute'
import * as Color from './Color'

export function textInput<A>(
    attributes: Array<Attribute.Attribute<A>>,
    args: {
        id: string,
        label: Layout.Layout<A>,
        value: string,
        attributes: Array<Attribute.Attribute<A>>,
    }
): Layout.Layout<A> {
    return Layout.column(
        "label",
        [
            Attribute.attribute("for", args.id),
            Attribute.style("width", "100%"),
            Attribute.style("height", "100%"),
            Attribute.spacing(14),
            ...attributes,
        ],
        [
            args.label,
            Layout.column(
                "input",
                [
                    Attribute.attribute("id", args.id),
                    Attribute.attribute("value", args.value),
                    Attribute.style("width", "100%"),
                    Attribute.style("height", "100%"),
                    ...args.attributes,
                ],
                []
            )
        ]
    )
}

export function button<A>(
    attributes: Array<Attribute.Attribute<A>>,
    args: {
        onClick: (event: any) => A,
        label: Layout.Layout<A>,
    }
): Layout.Layout<A> {
    return Layout.column(
        "button",
        [
            Attribute.on("click", args.onClick),
            ...attributes
        ],
        [args.label]
    )
}
