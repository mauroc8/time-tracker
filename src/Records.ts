import * as Record from './Record'
import * as Update from './Update'


import * as Date from './utils/Date'
import * as Time from './utils/Time'
import * as Utils from './utils/Utils'
import * as Array_ from './utils/Array'
import * as Maybe from './utils/Maybe'


import * as Layout from './layout/Layout'

import * as Html from './vdom/Html'

import * as Icon from './style/Icon'

import * as DateGroup from './DateGroup'
import * as TimeGroup from './TimeGroup'
import * as Transition from './Transition'
import * as Decoder from './utils/Decoder'

export type Records =
    { tag: 'Records', array: Array<Record.Record> }

export function mockRecords(today: Date.Date): Records {
    return {
        tag: 'Records',
        array: [
            Record.record(
                Record.id(0),
                "1",
                "Time tracker",
                Time.time(22, 54),
                Time.time(23, 25),
                Date.date(2020, 4, 18),
            ),
            Record.record(
                Record.id(1),
                "2",
                "Study english",
                Time.time(7, 15),
                Time.time(10, 49),
                Date.date(2021, 4, 22),
            ),
            Record.record(
                Record.id(2),
                "Login",
                "Elm",
                Time.time(14, 37),
                Time.time(17, 53),
                Date.date(2021, 4, 22),
            ),
            Record.record(
                Record.id(3),
                "Siempre es hoy!",
                "",
                Time.time(16, 20),
                Time.time(18, 0),
                today
            ),
            Record.record(
                Record.id(4),
                "Y más tarde",
                "",
                Time.time(18, 20),
                Time.time(20, 0),
                today
            ),
            Record.record(
                Record.id(5),
                "Ayer",
                "",
                Time.time(16, 20),
                Time.time(18, 0),
                Date.date(today.year, today.month, today.day - 1),
            )
        ]
    }
}

export const decoder: Decoder.Decoder<Records> =
    Decoder.andThen(
        Decoder.property("tag", Decoder.string),
        tag => {
            if (tag === "Records") {
                return Decoder.map(
                    Decoder.array(Record.decoder),
                    array => ({ tag, array })
                )
            }
            return Decoder.fail(`tag "${tag}" is not equal to "Records"`)
        }
    )

export function view<A, C>(
    records: Array<Record.Record>,
    today: Date.Date,
    collapsedGroups: Array<DateGroup.Tag>,
    collapsingTransition: Transition.Collapsing,
    clickedCollapseButton: (group: DateGroup.Tag) => A,
): Layout.Layout<A, C> {
    return Layout.columnWithSpacing(
        50,
        "div",
        [Html.class_("w-full")],
        records.length > 0
            ? Array_.groupWhile(
                records
                    .sort(Record.compare)
                    .reverse(),
                (a, b) =>
                    Utils.equals(
                        DateGroup.fromDate({ today, time: a.date }),
                        DateGroup.fromDate({ today, time: b.date })
                    )
            )
                .map(groupRecords => {
                    const groupTag = DateGroup.fromDate({ today, time: groupRecords[0].date });

                    return DateGroup.view(
                        groupTag,
                        groupRecords,
                        DateGroup.getCollapsingState(
                            groupTag,
                            collapsedGroups,
                            collapsingTransition
                        ),
                        clickedCollapseButton,
                        today,
                    )
                })
            : [Layout.text("No hay ninguna entrada todavía")]
    )
}
