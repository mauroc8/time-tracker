import * as Utils from '../utils/Utils'

export type Html<Evt> =
    | { nodeType: "node", tagName: string, attributes: Array<Attribute<Evt>>, children: Array<Html<Evt>> }
    | { nodeType: "text", text: string }

export function node<Evt>(
    tagName: string,
    attributes: Array<Attribute<Evt>>,
    children: Array<Html<Evt>>
): Html<Evt> {
    return { nodeType: "node", tagName, attributes, children }
}

export function text<Evt>(text: string): Html<Evt> {
    return { nodeType: "text", text }
}

export function toElement<Evt>(html: Html<Evt>, dispatch: (evt: Evt) => void): Element | Text {
    switch (html.nodeType) {
        case "node":
            const element = document.createElement(html.tagName)

            for (let attribute of html.attributes)
                toDomAttribute(attribute, dispatch, element)

            for (let child of html.children)
                element.appendChild(toElement(child, dispatch))

            return element

        case "text":
            return document.createTextNode(html.text)
    }
}

// Attr

export type Attribute<Evt> =
    | { tag: "attribute", name: string, value: string }
    | { tag: "property", name: string, value: unknown }
    | { tag: "eventHandler", eventName: string, handler: (event: Event) => Evt }
    | { tag: "style", property: string, value: string }
    | { tag: "class", value: string }

export function attribute<Evt>(name: string, value: string): Attribute<Evt> {
    return { tag: "attribute", name, value }
}

export function property<Evt>(name: string, value: unknown): Attribute<Evt> {
    return { tag: "property", name, value }
}

export function on<Evt>(eventName: string, handler: (event: Event) => Evt): Attribute<Evt> {
    return { tag: "eventHandler", eventName, handler }
}

export function style<Evt>(property: string, value: string): Attribute<Evt> {
    return { tag: "style", property, value }
}

export function class_<A>(className: string): Attribute<A> {
    return { tag: "class", value: className }
}

export function toDomAttribute<Evt>(attribute: Attribute<Evt>, dispatch: (evt: Evt) => void, $element: Element): void {
    switch (attribute.tag) {
        case "attribute":
            $element.setAttribute(attribute.name, attribute.value)
            return

        case "property":
            ($element as any)[attribute.name] = attribute.value
            return

        case "eventHandler":
            ($element as any)[`on${attribute.eventName}`] = (event: Event) =>
                dispatch(attribute.handler(event))

            return

        case "style":
            ($element as any).style[attribute.property] = attribute.value
            return

        case "class":
            try {
                $element.classList.add(attribute.value);
            } catch (e) {
                // ¯\_(ツ)_/¯
            }
            return
    }
}

export function padding<A>(x: number): Attribute<A> {
    return style("padding", `${x}px`)
}

export function paddingXY<A>(x: number, y: number): Attribute<A> {
    return style("padding", `${y}px ${x}px`)
}
