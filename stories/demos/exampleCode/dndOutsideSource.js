import React, {Fragment, useCallback, useMemo, useState} from 'react'
import PropTypes from 'prop-types'
import events from '../../resources/resourceEvents'
import {Calendar, Views, DateLocalizer} from 'react-big-calendar'
import Card from '../../resources/Card'
import DemoLink from '../../DemoLink.component'
// Storybook cannot alias this, so you would use 'react-big-calendar/lib/addons/dragAndDrop'
import withDragAndDrop from '../../../src/addons/dragAndDrop'
// Storybook cannot alias this, so you would use 'react-big-calendar/lib/addons/dragAndDrop/styles.scss'
import '../../../src/addons/dragAndDrop/styles.scss'
import MyToolbar from "./custom/MyToolbar";

const DragAndDropCalendar = withDragAndDrop(Calendar)

const resourceMap = [
    {
        resourceId: 'a',
        resourceTitle: 'Room A',
    },
    {
        resourceId: 'b',
        resourceTitle: 'Room B',
    },
    {
        resourceId: 'c',
        resourceTitle: 'Room C',
    },
]

const adjEvents = events.events.map((it, ind) => ({
    ...it,
    isDraggable: ind % 2 === 0,
}))

const formatName = (name, count) => `${name} ID ${count}`

const ResourceHeaderCustom = ({label}) => {
    return <React.Fragment>{label}!</React.Fragment>
}

export default function DnDOutsideResource({localizer}) {
    const [myEvents, setMyEvents] = useState(adjEvents)
    const [draggedEvent, setDraggedEvent] = useState()
    const [displayDragItemInCell, setDisplayDragItemInCell] = useState(true)
    const [counters, setCounters] = useState({item1: 0, item2: 0})

    const [date, setDate] = useState(new Date(2015, 3, 12))

    const eventPropGetter = useCallback(
        (event) => ({
            ...(event.isDraggable
                ? {className: 'isDraggable'}
                : {className: 'nonDraggable'}),
        }),
        []
    )
    //,
    const handleDragStart = useCallback((event) => setDraggedEvent(event), [])

    const dragFromOutsideItem = useCallback(() => draggedEvent, [draggedEvent])

    const customOnDragOver = useCallback(
        (dragEvent) => {
            // check for undroppable is specific to this example
            // and not part of API. This just demonstrates that
            // onDragOver can optionally be passed to conditionally
            // allow draggable items to be dropped on cal, based on
            // whether event.preventDefault is called
            if (draggedEvent !== 'undroppable') {
                console.log('preventDefault')
                dragEvent.preventDefault()
            }
        },
        [draggedEvent]
    )

    const handleDisplayDragItemInCell = useCallback(
        () => setDisplayDragItemInCell((prev) => !prev),
        []
    )

    const moveEvent = useCallback(
        ({event, start, end, isAllDay: droppedOnAllDaySlot = false}) => {
            const {allDay} = event
            if (!allDay && droppedOnAllDaySlot) {
                event.allDay = true
            }

            setMyEvents((prev) => {
                const existing = prev.find((ev) => ev.id === event.id) ?? {}
                const filtered = prev.filter((ev) => ev.id !== event.id)
                return [...filtered, {...existing, start, end, allDay}]
            })
        },
        [setMyEvents]
    )

    const newEvent = useCallback(
        (event) => {
            setMyEvents((prev) => {
                const idList = prev.map((item) => item.id)
                const newId = Math.max(...idList) + 1
                return [...prev, {...event, id: newId}]
            })
        },
        [setMyEvents]
    )

    const onDropFromOutside = useCallback(
        ({start, end, resource, allDay: isAllDay}) => {
            if (draggedEvent === 'undroppable') {
                setDraggedEvent(null)
                return
            }

            const {name} = draggedEvent
            const event = {
                title: formatName(name, counters[name]),
                resourceId: resource,
                start,
                end,
                isAllDay,
            }
            setDraggedEvent(null)
            setCounters((prev) => {
                const {[name]: count} = prev
                return {
                    ...prev,
                    [name]: count + 1,
                }
            })
            newEvent(event)
        },
        [draggedEvent, counters, setDraggedEvent, setCounters, newEvent]
    )

    const resizeEvent = useCallback(
        ({event, start, end}) => {
            setMyEvents((prev) => {
                const existing = prev.find((ev) => ev.id === event.id) ?? {}
                const filtered = prev.filter((ev) => ev.id !== event.id)
                return [...filtered, {...existing, start, end}]
            })
        },
        [setMyEvents]
    )

    const components = useMemo(
        () => {
            return {
                resourceHeader: ResourceHeaderCustom,
                toolbar: MyToolbar,
            }
        }, []
    )

    const onNavigate = useCallback(
        date => setDate(date),
        []
    )

    return (
        <Fragment>
            <DemoLink fileName="dndOutsideSource">
                <Card className="dndOutsideSourceExample">
                    <div className="inner">
                        <button onClick={() => setDate(new Date(2015, 3, 12))}>initial date!</button>

                        <h4>Outside Drag Sources</h4>
                        <p>
                            Lighter colored events, in the Calendar, have an `isDraggable` key
                            of `false`.
                        </p>
                        {Object.entries(counters).map(([name, count]) => (
                            <div
                                draggable="true"
                                key={name}
                                onDragStart={() =>
                                    handleDragStart({title: formatName(name, count), name})
                                }
                            >
                                {formatName(name, count)}
                            </div>
                        ))}
                        <div
                            draggable="true"
                            onDragStart={() => handleDragStart('undroppable')}
                        >
                            Draggable but not for calendar.
                        </div>
                    </div>

                    <div>
                        <label>
                            <input
                                type="checkbox"
                                checked={displayDragItemInCell}
                                onChange={handleDisplayDragItemInCell}
                            />
                            Display dragged item in cell while dragging over
                        </label>
                    </div>
                </Card>
            </DemoLink>
            <div className="height600">
                <DragAndDropCalendar
                    date={date}
                    defaultView={Views.MONTH}
                    dragFromOutsideItem={
                        displayDragItemInCell ? dragFromOutsideItem : null
                    }
                    draggableAccessor="isDraggable"
                    components={components}
                    eventPropGetter={eventPropGetter}
                    events={myEvents}
                    localizer={localizer}
                    onDropFromOutside={onDropFromOutside}
                    onDragOver={customOnDragOver}
                    onEventDrop={moveEvent}
                    onEventResize={resizeEvent}
                    onSelectSlot={newEvent}
                    onNavigate={onNavigate}
                    resizable
                    selectable
                    allDayHidden
                    resourceIdAccessor="resourceId"
                    resources={resourceMap}
                    resourceTitleAccessor="resourceTitle"
                    resourceWeekViewHeader="day"
                    dayLayoutAlgorithm="no-overlap"
                />
            </div>
        </Fragment>
    )
}
DnDOutsideResource.propTypes = {
    localizer: PropTypes.instanceOf(DateLocalizer),
}
