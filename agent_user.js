class AgentUser extends Agent {
	constructor() {
		super()
		this.player = undefined
		this.action = undefined
		this.actionResolution = undefined
	}

	/**
	 * @param {string} currentState 
	 * @returns 
	 */
	getAction(currentState) {
		if (this.action) {
			let action = this.action
			this.resolveAction = undefined
			this.action = undefined
			return action
		}
		else {
			return new Promise((resolve) => {
				this.resolveAction = resolve
			})
		}
	}

	/**
	 * @param {number} player 
	 * @param {Game} game 
	 */
	bind(player, game) {
		this.player = player
		this.game = game
		this.bindPieces(player)
	}

	bindPieces(player) {
		const SIDE_LEN = this.game.board.SIDE_LEN
		let drag = (e) => {
			/** @type {HTMLDivElement} */
			const pieceDiv = e.target
			centerPieceWithEvent(pieceDiv, SIDE_LEN, e)
			const startPos = pieceDiv.pos
			let player = this.game.board.getPlayerAt(startPos)
			const actions = this.game.board.getLegalActions(player).filter(action => action[0] == startPos)
			const pieceHints = actions.map(action => {
				const hintDiv = document.createElement('div')
				hintDiv.classList.add('hint')
				hintDiv.classList.add('square-'+action[action.length-1])
				pieceDiv.parentElement.appendChild(hintDiv)
				return hintDiv
			})
			
			/**
			 * @param {MouseEvent} e 
			 */
			const dragging = (e) => {
				centerPieceWithEvent(pieceDiv, SIDE_LEN, e)
			}
			const drop = (e) => {
				pieceDiv.classList.remove('dragging')
				pieceDiv.addEventListener("mousedown", drag)
				document.removeEventListener("mousemove", dragging)
				document.removeEventListener("mouseup", drop)

				let [col, row] = centerPieceWithEvent(pieceDiv, SIDE_LEN, e)
				pieceDiv.style.transform = ""
				col = clamp(Math.round(col), 0, SIDE_LEN-1)
				row = clamp(Math.round(row), 0, SIDE_LEN-1)

				// Check valid move
				const toEvenRow = (row+1) % 2 == 0
				const isValidSquare = (toEvenRow && col % 2 == 0) || (!toEvenRow && col % 2 == 1)
				if (isValidSquare) {
					const endPos = this.game.board.getPos(row, col)
					let action = undefined
					for (let i = 0; i < actions.length; ++i) {
						if (actions[i][0] === startPos && actions[i][actions[i].length-1] === endPos) {
							action = actions[i]
						}
					}
					if (action) {
						if (this.resolveAction) {
							this.resolveAction([false, action])
						}
						else {
							this.action
						}
					}
				}
				pieceHints.forEach(hintDiv => pieceDiv.parentElement.removeChild(hintDiv))
			}

			pieceDiv.classList.add('dragging')
			document.addEventListener("mousemove", dragging)
			document.addEventListener("mouseup", drop)
			pieceDiv.removeEventListener("mousedown", drag)
		}

		PLAYER_PIECE_TYPES[player].forEach((piece_type) => {
			this.game.container.querySelectorAll('.piece.'+SQUARE_STATES_TO_CLASS[piece_type]).forEach(
				(pieceDiv) => {
					pieceDiv.addEventListener("mousedown", drag)
				}
			)
		})
	}
}
