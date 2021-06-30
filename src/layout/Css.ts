import * as Utils from '../utils/Utils'
import * as Pair from '../utils/Pair'
import * as Html from '../vdom/Html'

// https://www.w3.org/TR/CSS22/syndata.html#statements
export type Statement =
    | { tag: 'class', class_: Class }
    | { tag: 'raw', selector: string, content: string }

export type Class = {
    name: string,
    normal?: Array<Property>,
    hover?: Array<Property>,
    focus?: Array<Property>,
    parentHover?: Array<Property>,
    parentFocus?: Array<Property>,
    group?: {
        name: string,
        hover?: Array<Property>,
        focus?: Array<Property>,
    },
}

export function class_(class_: Class): Statement {
    return {
        tag: 'class',
        class_,
    }
}

export function raw(selector: string, content: string): Statement {
    return {
        tag: 'raw',
        selector,
        content
    }
}

export function toHtml<E>(statements: Array<Statement>): Html.Html<E> {
    return Html.keyed<E>(
        'div',
        [],
        removeDuplicates(statements)
            .map(statement =>
                Pair.pair(
                    statementKey(statement),
                    Html.node(
                        'style',
                        [],
                        [Html.text(statementToString(statement))]
                    )
                )
            )
    )
}

function statementKey(statement: Statement): string {
    return statement.tag === 'class'
        ? statement.class_.name
        : `raw:${statement.selector}`
}

function statementToString(statement: Statement): string {
    return statement.tag === 'class'
        ? classToString(statement.class_)
        : `${statement.selector}{${statement.content}}`
}

function classToString(class_: Class): string {
    let cssString = ''

    if (class_.normal) {
        cssString += `.${class_.name}{${propertiesToString(class_.normal)}}\n`
    }
    if (class_.hover) {
        cssString += `.${class_.name}:hover{${propertiesToString(class_.hover)}}\n`
    }
    if (class_.focus) {
        cssString += `.${class_.name}:focus{${propertiesToString(class_.focus)}}\n`
    }
    if (class_.parentHover) {
        cssString += `*:hover>.${class_.name}{${propertiesToString(class_.parentHover)}}\n`
    }
    if (class_.parentFocus) {
        cssString += `*:focus>.${class_.name}{${propertiesToString(class_.parentFocus)}}\n`
    }
    if (class_.group?.hover) {
        cssString += `.${class_.group.name}:hover .${class_.name}{${propertiesToString(class_.group.hover)}}\n`
    }
    if (class_.group?.focus) {
        cssString += `.${class_.group.name}:focus .${class_.name}{${propertiesToString(class_.group.focus)}}\n`
    }

    return cssString
}

function removeDuplicates(statements: Array<Statement>): Array<Statement> {
    const dict: { [key: string]: Statement } = {}

    for (const statement of statements) {
        dict[statementKey(statement)] = statement
    }

    return Object.values(dict)
}

export type Property =
    | { name: string, value: string }

export function property(name: string, value: string): Property {
    return { name, value }
}

function propertiesToString(properties: Array<Property>): string {
    return properties.map(propertyToString).join(';')
}

function propertyToString(property: Property): string {
    return `${property.name}:${property.value}`
}
