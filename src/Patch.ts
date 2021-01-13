import * as Html from './Html'
import * as Utils from './Utils'

// Patch

export type Patch<Evt> =
    | { tag: "replaceNode", node: Html.Html<Evt> }
    | { tag: "patchNode", attributes: Array<AttributePatch<Evt>>, children: Array<ChildPatch<Evt>> }

export type ChildPatch<Evt> =
    | { tag: "insertChild", node: Html.Html<Evt> }
    | { tag: "removeChild" }
    | { tag: "patchChild", patch: Patch<Evt> }


type AttributePatch<Evt> =
    | { tag: "replaceAttribute", from: Html.Attribute<Evt>, to: Html.Attribute<Evt> }
    | { tag: "removeAttribute", attribute: Html.Attribute<Evt> }
    | { tag: "insertAttribute", attribute: Html.Attribute<Evt> }

export function diff<Evt>(a: Html.Html<Evt>, b: Html.Html<Evt>): Patch<Evt> {
    if (a.tag !== b.tag) {
        return { tag: "replaceNode", node: b }
    }

    return {
        tag: "patchNode",
        attributes: diffAttributes(a.attributes, b.attributes),
        children: diffChildren(a.children, b.children),
    }
}

function diffChildren<Evt>(a: Array<Html.Html<Evt>>, b: Array<Html.Html<Evt>>): Array<ChildPatch<Evt>> {
    const patches: Array<ChildPatch<Evt>> = []

    for (let i = 0; i < a.length && i < b.length; i = i + 1) {
        patches.push({ tag: "patchChild", patch: diff(a[i], b[i]) })
    }

    // Remove nodes in a but not in b
    for (let i = b.length; i < a.length; i = i + 1) {
        patches.push({ tag: "removeChild" })
    }

    // Insert nodes in b but not in a
    for (let i = a.length; i < b.length; i = i + 1) {
        patches.push({
            tag: "insertChild",
            node: b[i]
        })
    }

    return patches
}


function deepObjectEquality(a: any, b: any): boolean {
    if (a instanceof Array && b instanceof Array) {
        return a.length === b.length && a.every((x, i) => deepObjectEquality(x, b[i]))
    }

    switch (typeof a) {
        case "object":
            if (typeof b !== "object")
                return false

            for (var key of Object.keys(a)) {
                if (!deepObjectEquality(a[key], b[key]))
                    return false
            }
            return true

        case "function":
            // the best we can do
            return a === b

        default:
            return a === b
    }
}

function attributeEquals<Evt>(a: Html.Attribute<Evt>, b: Html.Attribute<Evt>): boolean {
    switch (a.tag) {
        case "attribute":
            return b.tag === "attribute" && a.name === b.name && a.value === b.value

        case "property":
            return b.tag === "property" && a.name === b.name && deepObjectEquality(a.value, b.value)

        case "eventHandler":
            return b.tag === "eventHandler" && a.eventName === b.eventName && a.handler === b.handler

        case "style":
            return b.tag === "style" && a.property === b.property && a.value === b.value
    }
}

function diffAttributes<Evt>(
    a: Array<Html.Attribute<Evt>>,
    b: Array<Html.Attribute<Evt>>
): Array<AttributePatch<Evt>> {
    const patches: Array<AttributePatch<Evt>> = []

    for (let i = 0; i < a.length && i < b.length; i = i + 1) {
        if (!attributeEquals(a[i], b[i])) {
            patches.push({
                tag: "replaceAttribute",
                from: a[i],
                to: b[i],
            })
        }
    }

    // Remove attributes that are in a but not in b
    for (let i = b.length; i < a.length; i = i + 1) {
        patches.push({
            tag: "removeAttribute",
            attribute: a[i],
        })
    }

    // Insert attributes that are in b but not in a
    for (let i = a.length; i < b.length; i = i + 1) {
        patches.push({
            tag: "insertAttribute",
            attribute: b[i],
        })
    }

    return patches
}

export function applyPatch<Evt>(
    patch: Patch<Evt>,
    dispatch: (evt: Evt) => void,
    element: Element
): void {
    switch (patch.tag) {
        case "replaceNode": {
            const parent = element.parentElement

            if (parent !== null) {
                parent.removeChild(element)
                parent.appendChild(
                    Html.toElement(patch.node, element.ownerDocument, dispatch)
                )
            }
            return
        }

        case "patchNode": {
            for (let attributePatch of patch.attributes)
                applyAttributePatch(attributePatch, dispatch, element)

            for (let i = 0; i < patch.children.length; i++)
                applyChildPatch(patch.children[i], dispatch, element, i)

            return
        }
    }
}

function applyChildPatch<Evt>(patch: ChildPatch<Evt>, dispatch: (evt: Evt) => void, parent: Element, i: number): void {
    switch (patch.tag) {
        case "insertChild":
            parent.appendChild(Html.toElement(patch.node, parent.ownerDocument, dispatch))
            return

        case "removeChild": {
            const child = parent.children[i]

            if (child !== undefined && child !== null)
                parent.removeChild(child)

            return
        }

        case "patchChild": {
            const child = parent.children[i]

            if (child !== undefined && child !== null)
                applyPatch(patch.patch, dispatch, child)

            return
        }
    }
}

function applyAttributePatch<Evt>(patch: AttributePatch<Evt>, dispatch: (evt: Evt) => void, element: any): void {
    switch (patch.tag) {
        case "insertAttribute":
            Html._insertAttribute(patch.attribute, dispatch, element)
            return

        case "removeAttribute":
            removeAttribute(patch.attribute, element)
            return

        case "replaceAttribute":
            removeAttribute(patch.from, element)
            Html._insertAttribute(patch.to, dispatch, element)
            return
    }
}

function removeAttribute<Evt>(attribute: Html.Attribute<Evt>, element: any): void {
    switch (attribute.tag) {
        case "attribute":
            element.removeAttribute(attribute.name)
            return

        case "property":
            element[attribute.name] = undefined
            return

        case "eventHandler":
            element[`on${Utils.upperCaseFirst(attribute.eventName)}`] = undefined
            return

        case "style":
            element.style[attribute.property] = undefined
            return
    }
}
