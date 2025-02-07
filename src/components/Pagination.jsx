import React, { useState } from 'react';
import './Pagination.css';

function Pagination({ totalPages, currentPage, onPageChange }) {
    const [showLeftPopover, setShowLeftPopover] = useState(false);
    const [leftInput, setLeftInput] = useState("");
    const [showRightPopover, setShowRightPopover] = useState(false);
    const [rightInput, setRightInput] = useState("");

    const handleLeftGo = () => {
        const pageNumber = parseInt(leftInput, 10);
        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
            onPageChange(pageNumber - 1);
            setShowLeftPopover(false);
            setLeftInput("");
        }
    };

    const handleRightGo = () => {
        const pageNumber = parseInt(rightInput, 10);
        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
            onPageChange(pageNumber - 1);
            setShowRightPopover(false);
            setRightInput("");
        }
    };

    const renderButton = (pageIndex) => (
        <button
            key={pageIndex}
            onClick={() => onPageChange(pageIndex)}
            className={currentPage === pageIndex ? 'active' : ''}
        >
            {pageIndex + 1}
        </button>
    );

    const renderEllipsis = (isLeft) => {
        return (
            <div key={isLeft ? 'left-ellipsis' : 'right-ellipsis'} className="ellipsis-container">
                <button
                    className="ellipsis-button"
                    onClick={() => {
                        if (isLeft) {
                            setShowLeftPopover(!showLeftPopover);
                            setShowRightPopover(false);
                        } else {
                            setShowRightPopover(!showRightPopover);
                            setShowLeftPopover(false);
                        }
                    }}
                >
                    ...
                </button>
                {isLeft && showLeftPopover && (
                    <div className="popover">
                        <input
                            type="number"
                            min="1"
                            max={totalPages}
                            value={leftInput}
                            onChange={(e) => setLeftInput(e.target.value)}
                            placeholder="Página"
                        />
                        <button onClick={handleLeftGo}>IR</button>
                    </div>
                )}
                {!isLeft && showRightPopover && (
                    <div className="popover">
                        <input
                            type="number"
                            min="1"
                            max={totalPages}
                            value={rightInput}
                            onChange={(e) => setRightInput(e.target.value)}
                            placeholder="Página"
                        />
                        <button onClick={handleRightGo}>IR</button>
                    </div>
                )}
            </div>
        );
    };

    let pageButtons = [];

    if (totalPages <= 10) {
        for (let i = 0; i < totalPages; i++) {
            pageButtons.push(renderButton(i));
        }
    } else {
        if (currentPage < 3) {
            for (let i = 0; i < 3; i++) {
                pageButtons.push(renderButton(i));
            }
            pageButtons.push(renderEllipsis(false));
            for (let i = totalPages - 3; i < totalPages; i++) {
                pageButtons.push(renderButton(i));
            }
        } else if (currentPage >= totalPages - 3) {
            for (let i = 0; i < 3; i++) {
                pageButtons.push(renderButton(i));
            }
            pageButtons.push(renderEllipsis(true));
            for (let i = totalPages - 3; i < totalPages; i++) {
                pageButtons.push(renderButton(i));
            }
        } else {
            for (let i = 0; i < 3; i++) {
                pageButtons.push(renderButton(i));
            }
            pageButtons.push(renderEllipsis(true));
            let start = currentPage - 1;
            if (start < 3) {
                start = 3;
            }
            const middleEnd = start + 3;
            for (let i = start; i < middleEnd; i++) {
                pageButtons.push(renderButton(i));
            }
            pageButtons.push(renderEllipsis(false));
            for (let i = totalPages - 3; i < totalPages; i++) {
                pageButtons.push(renderButton(i));
            }
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
    );
}

export default Pagination; 