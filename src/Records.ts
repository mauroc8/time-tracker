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
import * as Codec from './utils/Codec'
import * as SortedArray from './utils/SortedArray'


export type Records = SortedArray.SortedArray<Record.Record>

export const codec: Codec.Codec<Records> =
    SortedArray.codec(Record.codec, Record.compare)

function update(
    records: Records,
    id: Record.Id,
    fn: (record: Record.Record) => Record.Record,
): Records {
    return SortedArray.map(
        records,
        record =>
            Utils.equals(id, record.id)
                ? fn(record)
                : record,
        Record.compare
    )
}

export function updateInput(
    records: Records,
    id: Record.Id,
    input: Record.InputName,
    value: string
): Records {
    return update(records, id, record => Record.updateInput(record, input, value))
}

export function changeInput(
    records: Records,
    id: Record.Id,
    input: Record.InputName,
    value: string
): Records {
    return update(records, id, record => Record.cleanInputs(Record.changeInput(record, input, value)))
}

export function delete_(
    records: Records,
    id: Record.Id
): Records {
    return SortedArray.filter(
        records,
        record =>
            !Utils.equals(id, record.id)
    )
}

export function findById(
    records: Records,
    id: Record.Id
): Record.Record | undefined {
    return records.toArray.find(
        record => Utils.equals(record.id, id)
    )
}

export function mockRecords(today: Date.Date): Records {
    return SortedArray.fromArray(
        [
            Record.record(
                Record.id(0),
                '1',
                'Time tracker',
                Time.time(22, 54),
                Time.time(23, 25),
                Date.date(2020, 4, 18),
            ),
            Record.record(
                Record.id(1),
                '2',
                'Study english',
                Time.time(7, 15),
                Time.time(10, 49),
                Date.date(2021, 4, 22),
            ),
            Record.record(
                Record.id(2),
                'Login',
                'Elm',
                Time.time(14, 37),
                Time.time(17, 53),
                Date.date(2021, 4, 22),
            ),
            Record.record(
                Record.id(3),
                'Siempre es hoy!',
                '',
                Time.time(16, 20),
                Time.time(18, 0),
                today
            ),
            Record.record(
                Record.id(4),
                'Y más tarde',
                '',
                Time.time(18, 20),
                Time.time(20, 0),
                today
            ),
            Record.record(
                Record.id(5),
                'Ayer',
                '',
                Time.time(16, 20),
                Time.time(18, 0),
                Date.date(today.year, today.month, today.day - 1),
            )
        ],
        Record.compare
    )
}

export function view<E, Context extends { today: Date.Date }>(
    records: Array<Record.Record>,
    dateGroupState: DateGroup.State,
    config: {
        onGroupEvent: (evt: DateGroup.Event) => E,
        onChange: (id: Record.Id, input: Record.InputName, value: string) => E,
        onInput: (id: Record.Id, input: Record.InputName, value: string) => E,
        onPlay: (id: Record.Id) => E,
        onDelete: (id: Record.Id) => E,
    },
): Layout.Layout<E, Context> {
    return Layout.withContext(({ today }) =>
        Layout.column(
            'div',
            [
                Layout.spacing(Record.spacing * 3/2),
                Layout.fullWidth(),
            ],
            records.length > 0
                ? Array_.groupWhile(
                    records
                        .slice()
                        .sort(Record.compare)
                        .reverse(),
                    (a, b) =>
                        Utils.equals(
                            DateGroup.fromDate({ today, time: a.date }),
                            DateGroup.fromDate({ today, time: b.date })
                        )
                )
                    .map(groupRecords => {
                        const dateGroupId = DateGroup.fromDate({ today, time: groupRecords[0].date })

                        return DateGroup.view(
                            dateGroupId,
                            groupRecords,
                            dateGroupState,
                            config,
                        )
                    })
                : [Layout.text('No hay ninguna entrada todavía')]
        )
    )
}
