import React from "react"

import { styled } from '@mui/system'

import { useDrop } from 'react-dnd'

import { DRAG_DROP_TYPE_HEADER } from "../../../../constants"

import { 
    Box,
    TableHead,
    TableRow
} from "@mui/material"

import DnDTableCell from "./DnDTableCell"

import { TableContext } from "../../contexts/MTableContextProvider"

const HeadBlinkCell = styled('span', {
    shouldForwardProp: (props) => props !== "headCellPosX"
})<{ headCellPosX:number; }>(({ headCellPosX }) => ({
    position: 'absolute', 
    left: headCellPosX - 4, // Adjust for centering
    top: 0, // Adjust for centering
    width: 8, 
    height: '100%', 
    pointerEvents: 'none',
    zIndex: 1000,
    background: '#038C65',
}))

interface IChangeColumnSizeType {
    key: string
    index: number
    startWidt: number
    startPosition: number
}

const MTableHeader = () => {

    const tableContext = React.useContext(TableContext)

    const tblHeadRef = React.useRef<HTMLTableSectionElement>(null)

    const [, drop] = useDrop(() => ({ accept: DRAG_DROP_TYPE_HEADER }))

    const [isResizing, setIsResizing] = React.useState(false)
    const [headCellPosX, setHeadCellPosX] = React.useState<number>(0)
    const [headCellPagePosX, setHeadCellPagePosX] = React.useState<number>(0)
    const [InfoColumnResize, setInfoColumnResize] = React.useState<IChangeColumnSizeType | null>(null)

    const FindHead = React.useCallback(
        (key: string) => {
            if (tableContext == null) return { head: null, index: -1 }

            const head = tableContext.header.filter((h) => `${h.key}` === key)[0]

            return {
                head,
                index: tableContext.header.indexOf(head),
            }
        }, [tableContext.header],
    )

    const MoveHead = React.useCallback<(key: string, atIndex: number) => void>(
        (key: string, atIndex: number) => {
            const { head, index } = FindHead(key)

            if (head == null) return
            
            tableContext.moveHead?.(head, index, atIndex)

        }, [FindHead, tableContext],
    )

    const createMouseDownHandler = (cellRef: React.RefObject<HTMLTableCellElement>, key: string, index: number) => {
        return (e: React.MouseEvent<HTMLDivElement>) => {

            const startPosition = e.clientX

            const startCellWidth = Math.floor(cellRef.current?.offsetWidth || 0)

            const cellRectLeft = Math.floor(cellRef.current?.getBoundingClientRect().left || 0)

            const cellLeftLimit = cellRectLeft + (tableContext.minColumnWidth || 150)
            const cellRightLimit = cellRectLeft + (tableContext.maxColumnWidth || 400)

            setHeadCellPosX(startPosition - (tblHeadRef?.current?.getBoundingClientRect().left || 0))
    
            const onMouseMove = (mouseMoveEvent: MouseEvent) => {
                if (mouseMoveEvent.clientX > cellLeftLimit && mouseMoveEvent.clientX < cellRightLimit) {
                    setHeadCellPagePosX(mouseMoveEvent.pageX)
                    setHeadCellPosX(mouseMoveEvent.clientX - (tblHeadRef?.current?.getBoundingClientRect().left || 0))
                }
            }
        
            function onMouseUp() {
                document.body.removeEventListener("mousemove", onMouseMove)

                setIsResizing(false)
                setInfoColumnResize({
                    key,
                    index,
                    startWidt: Math.round(startCellWidth),
                    startPosition,
                })
            }
          
            setIsResizing(true)
            document.body.addEventListener("mousemove", onMouseMove)
            document.body.addEventListener("mouseup", onMouseUp, { once: true })
        }
    }

    React.useEffect(() => {
        if (!InfoColumnResize) return

        const { key, startWidt, startPosition } = InfoColumnResize

        const movement = Math.round(headCellPagePosX) - startPosition
        const newSize = startWidt + movement

        tableContext.updateColumnWidth?.(key, newSize)

        setInfoColumnResize(null)
        setHeadCellPagePosX(0)
        setHeadCellPosX(0)

    }, [InfoColumnResize, headCellPosX, tableContext])

    return (
        <TableHead ref={tblHeadRef}>
            <TableRow ref={drop} sx={{ position: 'relative' }}>
                {tableContext && tableContext.header.map((head, index) => (
                    <DnDTableCell 
                        key={index}
                        head={head}

                        findHeadData={FindHead}
                        moveHead={MoveHead}

                        createMouseDownHandler={createMouseDownHandler}
                    />
                ))}

                {isResizing && (<HeadBlinkCell headCellPosX={headCellPosX} />)}
            </TableRow>
        </TableHead>
    )
}

export default MTableHeader