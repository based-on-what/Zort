import { useState } from 'react';
import './Pagination.css';

function Pagination({ totalPages, currentPage, onPageChange }) {
    const [popover, setPopover] = useState(null) // 'left' | 'right' | null
    const [popoverInput, setPopoverInput] = useState('')

    const handleGo = () => {
        const pageNumber = parseInt(popoverInput, 10)
        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
            onPageChange(pageNumber - 1)
            setPopover(null)
            setPopoverInput('')
        }
    }

    const renderButton = (pageIndex) => (
        <button
            key={pageIndex}
            onClick={() => onPageChange(pageIndex)}
            className={currentPage === pageIndex ? 'active' : ''}
        >
            {pageIndex + 1}
        </button>
    )

    const renderEllipsis = (side) => (
        <div key={`${side}-ellipsis`} className="ellipsis-container">
            <button
                className="ellipsis-button"
                onClick={() => {
                    setPopover(prev => prev === side ? null : side)
                    setPopoverInput('')
                }}
            >
                ...
            </button>
            {popover === side && (
                <div className="popover">
                    <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={popoverInput}
                        onChange={e => setPopoverInput(e.target.value)}
                        placeholder="Page"
                    />
                    <button onClick={handleGo}>GO</button>
                </div>
            )}
        </div>
    )

    let pageButtons = []

    if (totalPages <= 10) {
        for (let i = 0; i < totalPages; i++) {
            pageButtons.push(renderButton(i))
        }
    } else {
        if (currentPage < 3) {
            for (let i = 0; i < 3; i++) pageButtons.push(renderButton(i))
            pageButtons.push(renderEllipsis('right'))
            for (let i = totalPages - 3; i < totalPages; i++) pageButtons.push(renderButton(i))
        } else if (currentPage >= totalPages - 3) {
            for (let i = 0; i < 3; i++) pageButtons.push(renderButton(i))
            pageButtons.push(renderEllipsis('left'))
            for (let i = totalPages - 3; i < totalPages; i++) pageButtons.push(renderButton(i))
        } else {
            for (let i = 0; i < 3; i++) pageButtons.push(renderButton(i))
            pageButtons.push(renderEllipsis('left'))
            const start = Math.max(currentPage - 1, 3)
            for (let i = start; i < start + 3; i++) pageButtons.push(renderButton(i))
            pageButtons.push(renderEllipsis('right'))
            for (let i = totalPages - 3; i < totalPages; i++) pageButtons.push(renderButton(i))
        }
    }

    return (
        <div className="pagination">
            {currentPage > 0 && (
                <button className="arrow-button" onClick={() => onPageChange(currentPage - 1)}>
                    &lt;
                </button>
            )}
            {pageButtons}
            {currentPage < totalPages - 1 && (
                <button className="arrow-button" onClick={() => onPageChange(currentPage + 1)}>
                    &gt;
                </button>
            )}
        </div>
    )
}

export default Pagination
