function clamp(n, min, max) {
	return Math.min(Math.max(n, min), max)
}

/**
 * @param {HTMLDivElement} pieceDiv 
 * @param {MouseEvent} e 
 */
function centerPieceWithEvent(pieceDiv, SIDE_LEN, e) {
	const cursorError = 1
	const parentRect = pieceDiv.parentElement.getBoundingClientRect()
	const parentX = pieceDiv.parentElement.clientLeft + parentRect.x
	const parentY = pieceDiv.parentElement.clientTop + parentRect.y
	const parentWidth = pieceDiv.parentElement.clientWidth
	const parentHeight = pieceDiv.parentElement.clientHeight
	let col = ((e.clientX-parentX+cursorError) / parentWidth) * SIDE_LEN - 0.5
	let row = ((e.clientY-parentY+cursorError) / parentHeight) * SIDE_LEN - 0.5
	col = clamp(col, -0.5, SIDE_LEN-0.5)
	row = clamp(row, -0.5, SIDE_LEN-0.5)
	pieceDiv.style.transform = "translate(" + col*100 + "%," + row*100 + "%)"
	return [col, row]
}


function getBoardStateFromURL() {
	const queryString = window.location.search
	const urlParams = new URLSearchParams(queryString)
	return urlParams.has('state') ? urlParams.get('state') : undefined
}
function setBoardStateInURL(state) {
	const url = new URL(window.location)
	url.searchParams.set('state', state)
	// console.log(url)
	window.history.pushState({}, '', url)
}
