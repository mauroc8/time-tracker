import * as Utils from '../utils/Utils'

export type Html<Event> =
    | { type: 'Html', nodeType: 'node', tagName: string, attributes: Array<Attribute<Event>>, children: Array<Html<Event>> }
    | { type: 'Html', nodeType: 'keyed', tagName: string, attributes: Array<Attribute<Event>>, children: Array<[string, Html<Event>]> }
    | { type: 'Html', nodeType: 'text', text: string }

export function node<E>(
    tagName: string,
    attributes: Array<Attribute<E>>,
    children: Array<Html<E>>
): Html<E> {
    return { type: 'Html', nodeType: 'node', tagName, attributes, children }
}

export function keyed<E>(
    tagName: string,
    attributes: Array<Attribute<E>>,
    children: Array<[string, Html<E>]>
): Html<E> {
    return { type: 'Html', nodeType: 'keyed', tagName, attributes, children }
}

export function text<Evt>(text: string): Html<Evt> {
    return { type: 'Html', nodeType: 'text', text }
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

        case 'keyed':
            return keyed(
                html.tagName,
                html.attributes.map(attr => mapAttribute(attr, f)),
                html.children.map(([key, child]) => [key, map(child, f)])
            )
    }
}

// Attr

export type Attribute<E> =
    | { tag: 'attribute', name: string, value: string }
    | { tag: 'property', name: string, value: unknown }
    | { tag: 'eventHandler', eventName: string, handler: (event: Utils.Json) => E }
    | { tag: 'style', property: string, value: string }
    | { tag: 'class', value: string }

export function attribute<E>(name: string, value: string): Attribute<E> {
    return { tag: 'attribute', name, value }
}

export function property<E>(name: string, value: unknown): Attribute<E> {
    return { tag: 'property', name, value }
}

export function on<E, A>(
    eventName: string,
    handler: (event: Utils.Json) => E,
): Attribute<E> {
    return {
        tag: 'eventHandler',
        eventName,
        handler,
    }
}

export function style<Evt>(property: string, value: string): Attribute<Evt> {
    return { tag: 'style', property, value }
}

export function class_<A>(className: string): Attribute<A> {
    return { tag: 'class', value: className }
}

function mapAttribute<A, B>(attribute: Attribute<A>, f: (a: A) => B): Attribute<B> {
    switch (attribute.tag) {
        case 'eventHandler':
            return {
                tag: 'eventHandler',
                eventName: attribute.eventName,
                handler: (a) => f(attribute.handler(a)),
            }
        default:
            return attribute
    }
}
