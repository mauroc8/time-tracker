import * as Html from '../vdom/Html'
import * as Layout from './Layout'

export function onInput<A>(handler: (value: string) => A): Html.Attribute<A> {
    return Html.on('input', event => handler((event.target as any).value));
}

export function onChange<A>(handler: (value: string) => A): Html.Attribute<A> {
    return Html.on('change', event => handler((event.target as any).value));
}

const inputCss = `
background-color: hsl(0, 0%, 5%);
color: hsl(0, 0%, 100%);
font-size: 14px;
letter-spacing: 0.04em;
font-weight: 300;
line-height: 38px;
padding-left: 8px;
padding-right: 8px;
`

const inputFocusCss = `
background-color: hsl(0, 0%, 0%);
outline: 0;
`

const labelCss = `
font-size: 14px;
letter-spacing: 0.08em;
font-weight: 500;
`

export function text<A, C>(
    flexDirection: 'row' | 'column',
    attributes: Array<Layout.Attribute<A, C>>,
    options: {
        id: string,
        label: Layout.Layout<A, C>,
        value: string,
        attributes: Array<Html.Attribute<A>>,
    }
): Layout.Layout<A, C> {
    return Layout.node(
        flexDirection,
        'label',
        [
            Html.attribute('for', options.id),
            Layout.rawCss('label', labelCss),
            Layout.rawCss('input', inputCss),
            Layout.rawCss('input:focus', inputFocusCss),
            ...attributes,
        ],
        [
            options.label,
            Layout.column(
                'input',
                [
                    Html.property('id', options.id),
                    Html.property('value', options.value),
                    Html.style('width', '100%'),
                    Html.style('height', '100%'),
                    Html.style('border-radius', '5px'),
                    ...options.attributes,
                ],
                []
            )
        ]
    )
}

export function button<A, C>(
    flexDirection: 'row' | 'column',
    attributes: Array<Layout.Attribute<A, C>>,
    children: Array<Layout.Layout<A, C>>,
    args: {
        onClick: A,
    }
): Layout.Layout<A, C> {
    return Layout.node(
        flexDirection,
        'button',
        [
            Html.on('click', _ => args.onClick),
            ...attributes
        ],
        children,
    )
}
