import * as Maybe from './utils/Maybe'
import * as Utils from './utils/Utils'
import * as CreateRecord from './CreateRecord'
import * as Record from './Record'
import * as Effect from './utils/Cmd'
import * as Decoder from './utils/decoder/Decoder'
import * as Time from './utils/Time'
import * as Date from './utils/Date'

// STATE ---

/** The whole state of the application.
*/
export type State = {
    createRecord: CreateRecord.CreateRecord,
    records: Array<Record.Record>,
    today: Date.Date,
}

export function initialState<Event>(flags: string | null, today: Date.Date): [State, Effect.Cmd<Event>] {
    try {
        return [
            Decoder
                .decode(
                    flags && JSON.parse(flags),
                    decoder(today)
                )
                .withDefault(initialUnsavedState(today)),
            Effect.none(),
        ]
    } catch (e) {
        return [initialUnsavedState(today), Effect.none()]
    }
}

function initialUnsavedState(today: Date.Date): State {
    return {
        createRecord: CreateRecord.empty(""),
        records: [
            Record.record(
                Record.id(0),
                "1",
                Time.time(22, 54),
                Time.time(23, 25),
                "Inweb",
                Date.date(2020, 4, 18),
            ),
            Record.record(
                Record.id(1),
                "2",
                Time.time(7, 15),
                Time.time(10, 49),
                "Inweb",
                Date.date(2021, 4, 22),
            ),
            Record.record(
                Record.id(2),
                "Login",
                Time.time(14, 37),
                Time.time(17, 53),
                "Inweb",
                Date.date(2021, 4, 22),
            ),
        ],
        today,
    }
}

export function decoder(today: Date.Date): Decoder.Decoder<State> {
    return Decoder.map2(
        Decoder.property('records', Decoder.array(Record.decoder)),
        Decoder.property('createRecord', CreateRecord.decoder),
        (records, createRecord) =>
            ({
                records,
                createRecord,
                today,
            })
    )
}
