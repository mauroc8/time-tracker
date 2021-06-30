import * as Utils from '../utils/Utils'
import * as Pair from '../utils/Pair'

export type Html<Evt> =
    | { type: 'Html', nodeType: 'node', tagName: string, attributes: Array<Attribute<Evt>>, children: Array<Html<Evt>> }
    | { type: 'Html', nodeType: 'keyed', tagName: string, attributes: Array<Attribute<Evt>>, children: Array<[string, Html<Evt>]> }
    | { type: 'Html', nodeType: 'text', text: string }
    | { type: 'Html', nodeType: 'lazy', lazy: Lazy<Evt> }

export function node<Evt>(
    tagName: string,
    attributes: Array<Attribute<Evt>>,
    children: Array<Html<Evt>>
): Html<Evt> {
    return { type: 'Html', nodeType: 'node', tagName, attributes, children }
}

export function keyed<Evt>(
    tagName: string,
    attributes: Array<Attribute<Evt>>,
    children: Array<[string, Html<Evt>]>
): Html<Evt> {
    return { type: 'Html', nodeType: 'keyed', tagName, attributes, children }
}

export function text<Evt>(text: string): Html<Evt> {
    return { type: 'Html', nodeType: 'text', text }
}

export function lazy<Evt>(
    lazy: Lazy<Evt, A>,
): Html<Evt> {
    return { type: 'Html', nodeType: 'lazy', lazy }
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
                html.children.map(([key, child]) => Pair.pair(key, map(child, f)))
            )
        
        case 'lazy':
            return {
                ...html,
                lazy: mapLazy(f, html.lazy)
            }
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

function mapAttribute<A, B>(attribute: Attribute<A>, f: (a: A) => B): Attribute<B> {
    switch (attribute.tag) {
        case 'eventHandler':
            return on(attribute.eventName, (a) => f(attribute.handler(a)))
        default:
            return attribute
    }
}


// --- Lazy

export type Lazy<E, A> = {
    function_: (arg: A) => Html<E>,
    argument: { [Key in keyof A]: EqualityCheck<A[Key]> },

    /** I mutate this property in-place:
     * - If I use `function_` to get the Html.
     * - If another Lazy is equal to this one and it has a `computed` Html.
     */
    computed: Html<E> | null,
}

export type EqualityChecks<Record> =
    { [Key in keyof Record]: EqualityCheck<Record[Key]> }

export type EqualityCheck<A> = {
    tag: 'referential' | 'structural',
    value: A
}

function flattenEqualityChecks<A>(
    argument: { [Key in keyof A]: EqualityCheck<A[Key]> },
): A {
    const response = {} as A

    for (const key in argument) if (Utils.hasOwnProperty(argument, key)) {
        response[key] = argument[key].value
    }

    return response
}

function lazy_<E, A>(
    function_: (arg: A) => Html<E>,
    argument: { [Key in keyof A]: EqualityCheck<A[Key]> },
): Lazy<E, A> {
    return {
        function_,
        argument,
        computed: null,
    }
}

export function lazyToHtml<E, A>(lazy: Lazy<E, A>): Html<E> {
    if (lazy.computed) {
        return lazy.computed
    }

    return lazy.computed = lazy.function_(flattenEqualityChecks(lazy.argument))
}

export function mapLazy<X, A, B>(
    f: (a: A) => B,
    lazy: Lazy<A, X>
): Lazy<B, X> {
    
}

export function referentialEquality<A>(value: A): EqualityCheck<A> {
    return { tag: 'referential', value }
}

export function structuralEquality<A>(value: A): EqualityCheck<A> {
    return { tag: 'structural', value }
}
