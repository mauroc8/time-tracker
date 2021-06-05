import * as Record from './Record'
import * as Update from './Update'


import * as Date from './utils/Date'
import * as Time from './utils/Time'
import * as Utils from './utils/Utils'
import * as Array_ from './utils/Array'
import * as Maybe from './utils/Maybe'


import * as Layout from './layout/Layout'

import * as Html from './vdom/Html'

import * as DateGroup from './DateGroup'
import * as Decoder from './utils/Decoder'

export type Records =
    { tag: 'Records', array: Array<Record.Record> }

export const decoder: Decoder.Decoder<Records> =
    Decoder.object2(
        'tag', Decoder.literal('Records'),
        'array', Decoder.array(Record.decoder)
    )

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

export function view<Context extends { today: Date.Date }>(
    records: Array<Record.Record>,
    dateGroupState: DateGroup.State,
): Layout.Layout<DateGroup.Event, Context> {
    return Layout.withContext(({ today }) =>
        Layout.columnWithSpacing(
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
                        const groupTag = DateGroup.fromDate({ today, time: groupRecords[0].date })

                        return DateGroup.view(
                            groupTag,
                            groupRecords,
                            dateGroupState
                        )
                    })
                : [Layout.text("No hay ninguna entrada todavía")]
        )
    )
}
