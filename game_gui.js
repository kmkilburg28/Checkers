class Game {

	/**
	 * @param {HTMLDivElement} container 
	 * @param {string|undefined} initial_state 
	 */
	constructor(container, initial_state) {
		this.board = new LogicBoard()
		this.container = container
		this.move_log_textarea = document.getElementById('move_log')
		this.move_log_textarea.innerHTML = ""

		this.drawBackground()
		if (!this.getSquaresStylesheet()) {
			this.setupBoardClasses()
		}
		if (initial_state) {
			this.board.setState(initial_state)
		}
		this.setupPieces()

		setBoardStateInURL(this.board.getState())
	}

	setAgents(agent1, agent2) {
		this.agents = [
			agent1,
			agent2
		]
		this.agents.forEach((agent, i) => agent.bind(i, this))
	}

	/**
	 * @param {Array} action 
	 */
	convertFormalActionToOutput(action) {
		const sep = (action.length > 2 ||
			Math.abs(this.board.getRow(action[0]-1)-this.board.getRow(action[1]-1)) > 1) ?
			'x' : '-'
		return action.map(pos => pos+1).join(sep)
	}

	async nextTurn() {
		const winner = this.board.getWinner()
		if (winner >= 0) {
			const move_log = this.move_log_textarea.innerHTML.trim().split('\n')
			const num_moves = move_log[0].length > 0 ? move_log.length : 0
			const win_msg = "Player " + PLAYER_COLOR[winner].toUpperCase() + " won in " + num_moves + " moves!"
			this.move_log_textarea.innerHTML += win_msg
			this.move_log_textarea.scrollTop = this.move_log_textarea.scrollHeight;
		}
		else {
			const curState = this.board.getState()
			const [doAutoMove, action] = await this.agents[this.board.turn].getAction(curState)
			if (!this.board.move(action[0], action[action.length-1])) {
				const error_msg = "Action by player " + this.board.turn + " is not legal: " + action.toLocaleString()
				throw new EvalError(error_msg)
			}
			this.move_log_textarea.innerHTML +=
				PLAYER_COLOR[OTHER_PLAYER[this.board.turn]].toUpperCase() +
				":\t" +
				this.convertFormalActionToOutput(this.board.convertFastActionPathToFormal(action)) +
				"\n"
			this.move_log_textarea.scrollTop = this.move_log_textarea.scrollHeight;

			if (doAutoMove) {
				await this.animateAutoMove(action)
			}
			else {
				await this.animateManualMove(action)
			}
			this.forceAnimationFramesThen(this, "nextTurn")
			// console.log(getBoardStateFromURL())
			setBoardStateInURL(this.board.getState())
		}
	}

	forceAnimationFramesThen(object, executeFunctionName) {
		let recursiveRequestAnimationFrame = (i) => {
			if (i < 0) {
				object[executeFunctionName]()
			}
			else {
				window.requestAnimationFrame(() => recursiveRequestAnimationFrame(i-1))
			}
		}
		recursiveRequestAnimationFrame(6)
	}


	/**
	 * @param {Array} action 
	 */
	animateAutoMove(action) {
		const startPos = action[0]
		const endPos = action[action.length-1]
		const pieceDiv = this.container.querySelector('.piece.square-'+startPos)
		let visitSquares = this.board.convertFastActionPathToFormal(action)
		return new Promise(async (resolve) => {
			for (let i = 1; i < visitSquares.length; i++) {
				await this.animateMove(pieceDiv, visitSquares[i-1], visitSquares[i], (i < action.length-1) ? action[i] : undefined)
			}
			await this.tryMakeKing(pieceDiv, endPos)
			resolve()
		})
	}
	/**
	 * @param {Array} action 
	 */
	animateManualMove(action) {
		const startPos = action[0]
		const endPos = action[action.length-1]
		const pieceDiv = this.container.querySelector('.piece.square-'+startPos)
		pieceDiv.classList.remove("square-"+startPos)
		pieceDiv.pos = endPos
		pieceDiv.classList.add("square-"+endPos)
		for (let i = 1; i < action.length-1; ++i) {
			const capturedPos = action[i]
			this.animateRemovePiece(capturedPos)
		}

		// King the moved piece if it is on the opponents kings row
		this.tryMakeKing(pieceDiv, endPos)
	}

	/**
	 * 
	 * @param {HTMLDivElement} pieceDiv 
	 * @param {number} startPos 
	 * @param {number} endPos 
	 * @param {number|undefined} endPos 
	 */
	async animateMove(pieceDiv, startPos, endPos, capturePos) {
		let squaresStyle = this.getSquaresStylesheet()
		if (capturePos) {
			this.animateRemovePiece(capturePos, pieceDiv.parentElement)
		}
		if (squaresStyle) {
			const startStyle = squaresStyle.cssRules.item(startPos)
			const endStyle = squaresStyle.cssRules.item(endPos)

			let [startCol, startRow] = startStyle.cssText.match(/\d+%/g)
			startRow = parseFloat(startRow.slice(0, startRow.length-1))
			startCol = parseFloat(startCol.slice(0, startCol.length-1))
			
			let [endCol, endRow] = endStyle.cssText.match(/\d+%/g)
			endRow = parseFloat(endRow.slice(0, endRow.length-1))
			endCol = parseFloat(endCol.slice(0, endCol.length-1))
			
			const duration = ANIMATION_TIME
			let startTime = undefined
			pieceDiv.style.zIndex = 2
			await new Promise(resolve => {
				let step = () => {
					if (startTime == undefined) {
						pieceDiv.classList.remove("square-"+startPos)
						pieceDiv.classList.add("square-"+endPos)
						startTime = (new Date()).getTime()
					}
					const elapsed = (new Date()).getTime() - startTime 
					let percentComplete = elapsed / duration
					let row = (endRow - startRow) * percentComplete + startRow
					let col = (endCol - startCol) * percentComplete + startCol
					pieceDiv.style.transform = "translate(" + col + "%," + row + "%)";
					if (elapsed < duration) {
						window.requestAnimationFrame(step)
					}
					else
					{
						pieceDiv.style = ""
						resolve()
					}
				}
				window.requestAnimationFrame(step)
			})
		}
		else {
			pieceDiv.classList.remove("squares-"+startPos)
			pieceDiv.classList.add("squares-"+endPos)
		}
	}

	/**
	 * @param {number} pos 
	 */
	async animateRemovePiece(pos) {
		let squaresStyle = this.getSquaresStylesheet()
		const pieceDiv = this.container.querySelector('.piece.square-'+pos)

		if (squaresStyle) {
			const duration = ANIMATION_TIME
			let startTime = undefined
			await new Promise(resolve => {
				let step = () => {
					if (startTime == undefined) {
						startTime = (new Date()).getTime()
					}
					const elapsed = (new Date()).getTime() - startTime 
					let percentComplete = elapsed / duration
					pieceDiv.style.opacity = 1 - percentComplete
					if (elapsed < duration) {
						window.requestAnimationFrame(step)
					}
					else
					{
						pieceDiv.parentElement.removeChild(pieceDiv)
						pieceDiv.style = ""
						resolve()
					}
				}
				window.requestAnimationFrame(step)
			})
		}
		else {
			pieceDiv.parentElement.removeChild(pieceDiv)
		}
	}

	/**
	 * @param {HTMLDivElement} pieceDiv 
	 * @param {number} piecePos 
	 */
	tryMakeKing(pieceDiv, piecePos) {
		// King the moved piece if it is on the opponents kings row
		if (piecePos < this.board.SQUARES_PER_ROW && pieceDiv.classList.contains(SQUARE_STATES_TO_CLASS[SQUARE_STATES.B_MAN])) {
			pieceDiv.classList.remove(SQUARE_STATES_TO_CLASS[SQUARE_STATES.B_MAN])
			pieceDiv.classList.add(SQUARE_STATES_TO_CLASS[SQUARE_STATES.B_KING])
		}
		else if (piecePos >= this.board.NUM_SQUARES-this.board.SQUARES_PER_ROW && pieceDiv.classList.contains(SQUARE_STATES_TO_CLASS[SQUARE_STATES.A_MAN])) {
			pieceDiv.classList.remove(SQUARE_STATES_TO_CLASS[SQUARE_STATES.A_MAN])
			pieceDiv.classList.add(SQUARE_STATES_TO_CLASS[SQUARE_STATES.A_KING])
		}
	}

	setupPieces() {
		this.clearBoard()

		for (let i = 0; i < this.board.NUM_SQUARES; ++i) {
			if (this.board.SQUARES[i] != SQUARE_STATES.EMPTY) {
				const pieceDiv = document.createElement('div')
				pieceDiv.draggable = false
				pieceDiv.classList.add("piece")

				pieceDiv.classList.add(SQUARE_STATES_TO_CLASS[this.board.SQUARES[i]])
				const squareClass = "square-" + i
				pieceDiv.classList.add(squareClass)
				this.container.appendChild(pieceDiv)

				pieceDiv.pos = i
			}
		}
	}

	getSquaresStylesheet() {
		let squaresStyle = undefined
		for (let i = 0; i < document.styleSheets.length; ++i) {
			let styleSheet = document.styleSheets.item(i)
			if (styleSheet.title === "squares") {
				squaresStyle = styleSheet
				break
			}
		}
		return squaresStyle
	}

	setupBoardClasses() {
		/** @type{HTMLStyleElement} */
		const style = document.createElement('style')
		style.title = "squares"
		document.head.appendChild(style)
		const sheet = style.sheet

		for (let row = 0, i = 0; row < this.board.SIDE_LEN; ++row) {
			for (let col = (row+1) % 2; col < this.board.SIDE_LEN; col += 2, ++i) {
				const squareClass = "square-" + i
				const squareClassRule = "."+squareClass+" { transform: translate("+ col*100 + "%," + row*100 + "%); }"
				sheet.insertRule(squareClassRule, i)
			}
		}
	}

	/**
	 * @param {HTMLDivElement} container 
	 */
	clearBoard() {
		while (this.container.children.length > 0) {
			this.container.childNodes[0].remove()
		}
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx 
	 */
	drawBackground() {
		/** @type {HTMLCanvasElement} */
		const canvas = document.createElement('canvas')
		canvas.width = this.container.clientWidth*4
		canvas.height = this.container.clientHeight*4
		const squareWidth = canvas.width / this.board.SIDE_LEN

		const ctx = canvas.getContext('2d')
		ctx.fillStyle = "#F7F5F3"
		for (let row = 0; row < this.board.SIDE_LEN; ++row) {
			for (let col = row % 2; col < this.board.SIDE_LEN; col += 2) {
				ctx.fillRect(row*squareWidth, col*squareWidth, squareWidth, squareWidth)
			}
		}
		ctx.fillStyle = "#333333"
		for (let row = 0; row < this.board.SIDE_LEN; ++row) {
			for (let col = (row+1) % 2; col < this.board.SIDE_LEN; col += 2) {
				ctx.fillRect(row*squareWidth, col*squareWidth, squareWidth, squareWidth)
			}
		}

		/** @type {HTMLImageElement} */
		let backgroundImg = this.container.querySelector('.background')
		if (!backgroundImg) {
			backgroundImg = document.createElement('img')
			backgroundImg.classList.add('background')
			backgroundImg.draggable = false
		}
		backgroundImg.src = canvas.toDataURL()
		this.container.parentElement.insertBefore(backgroundImg, this.container)
	}
}