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

export function textInputCss(): string {
    return `
    label {
        color: ${Color.toCssString(Color.gray500)};
        font-size: 14px;
        letter-spacing: 0.08em;
        font-weight: 500;
    }
    input {
        background-color: ${Color.toCssString(Color.gray50)};
        color: ${Color.toCssString(Color.white)};
        font-size: 14px;
        letter-spacing: 0.04em;
        font-weight: 300;
        line-height: 38px;
        padding-left: 8px;
        padding-right: 8px;
    }
    input:focus {
        background-color: ${Color.toCssString(Color.black)};
    }`;
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
