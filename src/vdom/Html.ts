import * as Utils from '../utils/Utils'

export type Html<Evt> =
    | { type: 'Html', nodeType: 'node', tagName: string, attributes: Array<Attribute<Evt>>, children: Array<Html<Evt>> }
    | { type: 'Html', nodeType: 'text', text: string }

export function node<Evt>(
    tagName: string,
    attributes: Array<Attribute<Evt>>,
    children: Array<Html<Evt>>
): Html<Evt> {
    return { type: 'Html', nodeType: 'node', tagName, attributes, children }
}

export function text<Evt>(text: string): Html<Evt> {
    return { type: 'Html', nodeType: 'text', text }
}

export function toElement<Evt>(html: Html<Evt>, dispatch: (evt: Evt) => void): Element | Text {
    switch (html.nodeType) {
        case 'node':
            const element = document.createElement(html.tagName)

            for (let attribute of html.attributes)
                toDomAttribute(attribute, dispatch, element)

            for (let child of html.children)
                element.appendChild(toElement(child, dispatch))

            return element

        case 'text':
            return document.createTextNode(html.text)
    }
}

export function map<A, B>(html: Html<A>, f: (a: A) => B): Html<B> {
    switch (html.nodeType) {
        case 'node':
            return node(
                html.tagName,
                html.attributes.map(attr => mapAttribute(attr, f)),
                html.children.map(child => map(child, f))
            )
        case 'text':
            return html
    }
}

// Attr

export type Attribute<Evt> =
    | { tag: 'attribute', name: string, value: string }
    | { tag: 'property', name: string, value: unknown }
    | { tag: 'eventHandler', eventName: string, handler: (event: Event) => Evt }
    | { tag: 'style', property: string, value: string }
    | { tag: 'class', value: string }

export function attribute<Evt>(name: string, value: string): Attribute<Evt> {
    return { tag: 'attribute', name, value }
}

export function property<Evt>(name: string, value: unknown): Attribute<Evt> {
    return { tag: 'property', name, value }
}

export function on<Evt>(eventName: string, handler: (event: Event) => Evt): Attribute<Evt> {
    return { tag: 'eventHandler', eventName, handler }
}

export function style<Evt>(property: string, value: string): Attribute<Evt> {
    return { tag: 'style', property, value }
}

export function class_<A>(className: string): Attribute<A> {
    return { tag: 'class', value: className }
}

export function toDomAttribute<Evt>(attribute: Attribute<Evt>, dispatch: (evt: Evt) => void, $element: Element): void {
    switch (attribute.tag) {
        case 'attribute':
            $element.setAttribute(attribute.name, attribute.value)
            return

        case 'property':
            ($element as any)[attribute.name] = attribute.value
            return

        case 'eventHandler':
            ($element as any)[`on${attribute.eventName}`] = (event: Event) =>
                dispatch(attribute.handler(event))

            return

        case 'style':
            ($element as any).style[attribute.property] = attribute.value
            return

        case 'class':
            try {
                $element.classList.add(attribute.value)
            } catch (e) {
                // ¯\_(ツ)_/¯
            }
            return
    }
}

function mapAttribute<A, B>(attribute: Attribute<A>, f: (a: A) => B): Attribute<B> {
    switch (attribute.tag) {
        case 'eventHandler':
            return on(attribute.eventName, (a) => f(attribute.handler(a)))
        default:
            return attribute
    }
}
