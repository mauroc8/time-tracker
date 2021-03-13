import * as Html from '../vdom/Html'


export type Attribute<A> =
    | { attributeType: "spacing", value: number }
    | { attributeType: "htmlAttribute", value: Html.Attribute<A> }
    | { attributeType: "emptyAttribute" }


export function spacing<A>(value: number): Attribute<A> {
    return { attributeType: "spacing", value }
}

export function padding<A>(value: number): Attribute<A> {
    return style("padding", value + "px")
}

export function paddingXY<A>(x: number, y: number): Attribute<A> {
    return style("padding", `${y}px ${x}px`)
}

function html<A>(value: Html.Attribute<A>): Attribute<A> {
    return { attributeType: "htmlAttribute", value }
}

export function empty<A>(): Attribute<A> {
    return { attributeType: "emptyAttribute" }
}

export function style<A>(cssProperty: string, value: string): Attribute<A> {
    return html(Html.style(cssProperty, value))
}

export function attribute<A>(attributeName: string, value: string): Attribute<A> {
    return html(Html.attribute(attributeName, value))
}

export function on<A>(eventName: string, handler: (event: any) => A): Attribute<A> {
    return html(Html.on(eventName, handler))
}
