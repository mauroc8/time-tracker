import * as Html from './Html'
import * as Utils from '../Utils'

export function diff<T>(
    oldVDom: Html.Html<T>,
    newVDom: Html.Html<T>,
    dispatch: (event: T) => void,
): ($node: Element | Text) => Element | Text {

    if (oldVDom.nodeType === "text"
        || newVDom.nodeType === "text"
        || oldVDom.tagName !== newVDom.tagName
    ) {
        return $node => {
            const $newNode = Html.toElement(newVDom, dispatch)
            $node.replaceWith($newNode)
            return $newNode
        }
    } else {
        const patchAttributes = diffAttributes(oldVDom.attributes, newVDom.attributes, dispatch)
        const patchChildren = diffChildren(oldVDom.children, newVDom.children, dispatch)

        return $node => {
            patchAttributes($node)
            patchChildren($node)

            return $node
        }
    }
}

/** Like List.map2 but without ignoring elements if one list is larger than the other */
function map2Extra<A, B>(
    xs: Array<A>,
    ys: Array<A>,
    bothPresent: (x: A, y: A, index: number) => B,
    xPresent: (x: A, index: number) => B,
    yPresent: (y: A, index: number) => B
): Array<B> {
    const array: Array<B> = []

    for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
        array.push(bothPresent(xs[i], ys[i], i))
    }

    for (let i = ys.length; i < xs.length; i++) {
        array.push(xPresent(xs[i], i))
    }

    for (let i = xs.length; i < ys.length; i++) {
        array.push(yPresent(ys[i], i))
    }

    return array
}

// diffAttributes

function diffAttributes<T>(
    oldAttributes: Array<Html.Attribute<T>>,
    newAttributes: Array<Html.Attribute<T>>,
    dispatch: (event: T) => void,
): ($node: Element | Text) => void {

    const patches = map2Extra(
        oldAttributes,
        newAttributes,
        (oldAttr, newAttr, i) => ($node: Element) => {
            if (!attributeEquality(oldAttr, newAttr)) {
                removeAttribute(oldAttr, $node)
                Html.toDomAttribute(newAttr, dispatch, $node)
            }
        },
        (oldAttr, i) => $node => {
            removeAttribute(oldAttr, $node)
        },
        (newAttr, i) => $node => {
            Html.toDomAttribute(newAttr, dispatch, $node)
        }
    )

    return $node => {
        if ($node instanceof Element)
            patches.forEach(patch => patch($node))
    }
}

function attributeEquality<T>(a: Html.Attribute<T>, b: Html.Attribute<T>): boolean {
    if (a.tag === "attribute" && b.tag === "attribute") {
        return a.name === b.name && a.value === b.value
    } else if (a.tag === "property" && b.tag === "property") {
        return a.name === b.name && Utils.deepEquality(a.value, b.value)
    } else if (a.tag === "eventHandler" && b.tag === "eventHandler") {
        // The function comparison will most likely always return false;
        // a smarter implementation could optimize this case somehow.
        return a.eventName === b.eventName && a.handler === b.handler
    } else if (a.tag === "style" && b.tag === "style") {
        return a.property === b.property && a.value === b.value
    }

    return false
}

function removeAttribute<T>(attr: Html.Attribute<T>, $node: Element): void {
    if ($node instanceof Text) {
        // Text nodes don't have attributes AFAIK
        return
    }

    switch (attr.tag) {
        case "attribute":
            $node.removeAttribute(attr.name)
            return
        case "property":
            ($node as any)[attr.name] = undefined
            return
        case "eventHandler":
            ($node as any)[`on${attr.eventName}`] = undefined
            return
        case "style":
            ($node as any).style[attr.property] = ""
            return
    }

    Utils.assertNever(attr)
}


// diffChildren

function diffChildren<T>(
    oldChildren: Array<Html.Html<T>>,
    newChildren: Array<Html.Html<T>>,
    dispatch: (event: T) => void,
): ($parent: Element | Text) => void {
    return $parent => {
        if ($parent instanceof Element) {
            /** We need the $parent to calculate the patches because we need to save childNodes[i]
             * before removing elements, which could alter the indexing.
             */
            const patches = getChildrenPatches(oldChildren, newChildren, dispatch, $parent)
            patches.forEach(patch => patch())
        }
    }
}

function getChildrenPatches<T>(
    oldChildren: Array<Html.Html<T>>,
    newChildren: Array<Html.Html<T>>,
    dispatch: (event: T) => void,
    $parent: Element,
): Array<() => void> {
    return map2Extra(
        oldChildren,
        newChildren,
        (oldChild, newChild, i) => {
            const $child = $parent.childNodes[i]

            return () => {
                if ($child instanceof Element || $child instanceof Text)
                    diff(oldChild, newChild, dispatch)($child)
                else
                    throw { $parent, oldChild, newChild, $child }
            }
        },
        (oldChild, i) => {
            const $child = $parent.childNodes[i]

            return () => {
                $child.remove()
            }
        },
        (newChild, i) => () => {
            $parent.appendChild(Html.toElement(newChild, dispatch))
        }
    )
}

