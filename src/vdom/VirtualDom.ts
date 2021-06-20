import * as Html from './Html'

import * as Utils from '../utils/Utils'
import * as Maybe from '../utils/Maybe'
import * as Result from '../utils/Result'
import * as Array_ from '../utils/Array'
import * as Decoder from '../utils/Decoder'

export function diff<T>(
    oldVDom: Html.Html<T>,
    newVDom: Html.Html<T>,
    dispatch: (event: T) => void,
): ($node: Element | Text) => Element | Text {
    if (oldVDom.nodeType === 'text'
        || newVDom.nodeType === 'text'
        || oldVDom.tagName !== newVDom.tagName
    ) {
        return replace(newVDom, dispatch)
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

export function render<Evt>(html: Html.Html<Evt>, dispatch: (evt: Evt) => void): Element | Text {
    switch (html.nodeType) {
        case 'node':
            const element = document.createElement(html.tagName)

            for (let attribute of html.attributes)
                toDomAttribute(attribute, dispatch, element)

            for (let child of html.children)
                element.appendChild(render(child, dispatch))

            return element

        case 'text':
            return document.createTextNode(html.text)
    }
}

function toDomAttribute<Evt>(attribute: Html.Attribute<Evt>, dispatch: (evt: Evt) => void, $element: Element): void {
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

function replace<T>(
    newVDom: Html.Html<T>,
    dispatch: (event: T) => void,
) {
    return ($node: Element | Text) => {
        const $newNode = render(newVDom, dispatch)
        $node.replaceWith($newNode)
        return $newNode
    }
}

/** A list's indexed map2 but without dropping elements.
 */
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
                replaceAttribute(oldAttr, newAttr, dispatch, $node)
            }
        },
        (oldAttr, i) => $node => {
            removeAttribute(oldAttr, $node)
        },
        (newAttr, i) => $node => {
            toDomAttribute(newAttr, dispatch, $node)
        }
    )

    return $node => {
        if ($node instanceof Element)
            patches.forEach(patch => patch($node))
    }
}

function replaceAttribute<A>(
    oldAttr: Html.Attribute<A>,
    newAttr: Html.Attribute<A>,
    dispatch: (event: A) => void,
    $node: Element
) {
    /** Handle this special case for input.value and similar. */
    if (oldAttr.tag === 'property' && newAttr.tag === 'property') {
        if (oldAttr.name === newAttr.name) {
            if (($node as any)[newAttr.name] !== newAttr.value) {
                ($node as any)[newAttr.name] = newAttr.value;
            }
            return
        }
    }

    removeAttribute(oldAttr, $node)
    toDomAttribute(newAttr, dispatch, $node)
}

function attributeEquality<T>(a: Html.Attribute<T>, b: Html.Attribute<T>): boolean {
    if (a.tag === 'attribute' && b.tag === 'attribute') {
        return a.name === b.name && a.value === b.value
    } else if (a.tag === 'property' && b.tag === 'property') {
        return a.name === b.name && Utils.equals(a.value, b.value)
    } else if (a.tag === 'eventHandler' && b.tag === 'eventHandler') {
        // The function comparison will most likely always return false
        // a smarter implementation could optimize this case somehow.
        return a.eventName === b.eventName && a.handler === b.handler
    } else if (a.tag === 'style' && b.tag === 'style') {
        return a.property === b.property && a.value === b.value
    } else if (a.tag === 'class' && b.tag === 'class') {
        return a.value === b.value
    }

    return false
}

function removeAttribute<T>(attr: Html.Attribute<T>, $node: Element): void {
    if ($node instanceof Text) {
        // Text nodes don't have attributes
        return
    }

    try {
        switch (attr.tag) {
            case 'attribute':
                $node.removeAttribute(attr.name)
                return
            case 'property':
                ($node as any)[attr.name] = undefined
                return
            case 'eventHandler':
                ($node as any)[`on${attr.eventName}`] = undefined
                return
            case 'style':
                ($node as any).style[attr.property] = ''
                return
            case 'class':
                $node.classList.remove(attr.value)
                return
        }
    } catch (e) {
        // ¯\_(ツ)_/¯
        return
    }
}


// diffChildren

function diffChildren<T>(
    oldChildren: Array<Html.Html<T>>,
    newChildren: Array<Html.Html<T>>,
    dispatch: (event: T) => void,
): ($parent: Element | Text) => void {
    return $parent => {
        if ($parent instanceof Element) {
            /** We need to calculate all the patches and then apply them because we could alter the indexes
             * when applying some patch.
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
            $parent.appendChild(render(newChild, dispatch))
        }
    )
}

