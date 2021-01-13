import * as Utils from './Utils'

export type Html<Evt> = {
    tag: string,
    attributes: Array<Attribute<Evt>>,
    children: Array<Html<Evt>>
}

export function node<Evt>(
    tag: string,
    attributes: Array<Attribute<Evt>>,
    children: Array<Html<Evt>>
): Html<Evt> {
    return { tag, attributes, children }
}

export function _insertAttribute<Evt>(attribute: Attribute<Evt>, dispatch: (evt: Evt) => void, element: any): void {
    switch (attribute.tag) {
        case "attribute":
            element.setAttribute(attribute.name, attribute.value)
            return

        case "property":
            element[attribute.name] = attribute.value
            return

        case "eventHandler":
            element[`on${Utils.upperCaseFirst(attribute.eventName)}`] = (event: any) =>
                dispatch(attribute.handler(event))

            return

        case "style":
            element.style[attribute.property] = attribute.value
            return
    }
}

export function toElement<Evt>(html: Html<Evt>, document: Document, dispatch: (evt: Evt) => void): Element {
    const element = document.createElement(html.tag)

    for (let attribute of html.attributes)
        _insertAttribute(attribute, dispatch, element)

    for (let child of html.children)
        element.appendChild(toElement(child, document, dispatch))

    return element
}


// Attr

export type Attribute<Evt> =
    | { tag: "attribute", name: string, value: string }
    | { tag: "property", name: string, value: any }
    | { tag: "eventHandler", eventName: string, handler: (event: any) => Evt }
    | { tag: "style", property: string, value: string }

export function attribute<Evt>(name: string, value: string): Attribute<Evt> {
    return { tag: "attribute", name, value }
}

export function property<Evt>(name: string, value: any): Attribute<Evt> {
    return { tag: "property", name, value }
}

export function on<Evt>(eventName: string, handler: (event: any) => Evt): Attribute<Evt> {
    return { tag: "eventHandler", eventName, handler }
}

export function style<Evt>(property: string, value: string): Attribute<Evt> {
    return { tag: "style", property, value }
}
