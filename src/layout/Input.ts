import * as Html from '../vdom/Html'
import * as Layout from './Layout'
import './Input.css'

export function onInput<A>(handler: (value: string) => A): Html.Attribute<A> {
    return Html.on('input', event => handler((event.target as any).value));
}

export function onChange<A>(handler: (value: string) => A): Html.Attribute<A> {
    return Html.on('change', event => handler((event.target as any).value));
}

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
