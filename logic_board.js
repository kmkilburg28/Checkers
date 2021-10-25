class LogicBoard {
	constructor() {
		this.SIDE_LEN = 8
		this.SQUARES_PER_ROW = this.SIDE_LEN / 2
		const START_NUM_RANKS = 3
		this.NUM_SQUARES = (this.SIDE_LEN*this.SIDE_LEN) / 2
		this.SQUARES = (new Uint8Array(this.NUM_SQUARES)).fill(SQUARE_STATES.EMPTY)
		const MAX_PIECES_PER_PLAYER = this.SQUARES_PER_ROW * START_NUM_RANKS
		this.turn = PLAYERS.A
		this.playerPiecesPos = (new Array(NUM_PLAYERS)).fill(0).map((_, i) =>
			(new Uint8Array(MAX_PIECES_PER_PLAYER+1)).fill(REMOVED_PIECE)
		)
		for (let i = 0; i < MAX_PIECES_PER_PLAYER; ++i) {
			this.playerPiecesPos[PLAYERS.A][i] = i
		}
		for (let i = 0; i < MAX_PIECES_PER_PLAYER; ++i) {
			this.playerPiecesPos[PLAYERS.B][i] = (this.NUM_SQUARES - MAX_PIECES_PER_PLAYER) + i
		}

		this.STATE_SEP = '+'
		
		for (let i = 0; i < this.SQUARES_PER_ROW*START_NUM_RANKS; ++i) {
			this.SQUARES[i] = SQUARE_STATES.A_MAN
		}
		for (let i = this.NUM_SQUARES-this.SQUARES_PER_ROW*START_NUM_RANKS; i < this.NUM_SQUARES; ++i) {
			this.SQUARES[i] = SQUARE_STATES.B_MAN
		}

		this.SQUARE_NODES = new Array(this.NUM_SQUARES)
		for (let i = 0; i < this.NUM_SQUARES; ++i) {
			this.SQUARE_NODES[i] = new SquareNode(i)
		}
		
		for (let i = 0; i < this.NUM_SQUARES; ++i) {
			const squareNode = this.SQUARE_NODES[i]
			const evenRank = Math.floor(i / this.SQUARES_PER_ROW) % 2 == 0
			if (i >= this.SQUARES_PER_ROW) {
				// Then we can move up from the square
				const firstMovPos = i - 4
				squareNode.addAdjacentNode(this.SQUARE_NODES[firstMovPos])
				const secondMovPos = i - (evenRank ? 3 : 5)
				const movRow = Math.floor(i / this.SQUARES_PER_ROW) - 1
				if (Math.floor(secondMovPos / this.SQUARES_PER_ROW) == movRow) {
					squareNode.addAdjacentNode(this.SQUARE_NODES[secondMovPos])
				}

				// Then add capture nodes as well
				const captureRow = movRow - 1
				if (captureRow >= 0) {
					const firstCapturePos = firstMovPos - (evenRank ? 5 : 3)
					if (Math.floor(firstCapturePos / this.SQUARES_PER_ROW) == captureRow) {
						squareNode.addCaptureNodeDest(firstMovPos, this.SQUARE_NODES[firstCapturePos])
					}
					const secondCapturePos = secondMovPos - 4
					if (Math.floor(secondCapturePos / this.SQUARES_PER_ROW) == captureRow) {
						squareNode.addCaptureNodeDest(secondMovPos, this.SQUARE_NODES[secondCapturePos])
					}
				}
			}
		}
		this.SQUARE_NODES.forEach(node => node.sortAdjacentNodes())
	}

	getDirection(piece_pos) {
		switch (this.SQUARES[piece_pos]) {
			case SQUARE_STATES.A_MAN:
				return 1
			case SQUARE_STATES.B_MAN:
				return -1
			default:
				return 0
		}
	}
	getPlayerAt(pos) {
		return PLAYER_PIECE_TYPES[PLAYERS.A].has(this.SQUARES[pos]) ? PLAYERS.A : PLAYERS.B
	}

	getLegalActions(player) {
		if (player != this.turn) {
			return []
		}
		const opponent = OTHER_PLAYER[player]
		const piecesPos = this.playerPiecesPos[player]
		let mustCapture = false
		let actions = []
		for (let i = 0; piecesPos[i] != REMOVED_PIECE; ++i) {
			const pieceNode = this.SQUARE_NODES[piecesPos[i]]
			const direction = this.getDirection(piecesPos[i])
			let [newMustCapture, newActions] = this.getActionsFromNode(pieceNode, opponent, direction, mustCapture)
			if (newMustCapture && !mustCapture) {
				actions = newActions
				mustCapture = true
			}
			else {
				actions = actions.concat(newActions)
			}
		}
		return actions
	}

	/**
	 * @param {SquareNode} squareNode 
	 * @param {number} opponent 
	 * @param {number} direction 
	 */
	getActionsFromNode(squareNode, opponent, direction, mustCapture) {
		let moveActions = []
		let captureActions = []
		for (let adjInd = 0; adjInd < squareNode.adjacentNodes.length; ++adjInd) {
			const adjNode = squareNode.adjacentNodes[adjInd]
			const movDir = adjNode.pos - squareNode.pos
			if ((direction > 0 && movDir > 0) || (direction < 0 && movDir < 0) || direction == 0) {
				const adjState = this.SQUARES[adjNode.pos]
				if (!mustCapture && adjState == SQUARE_STATES.EMPTY) {
					moveActions.push([squareNode.pos, adjNode.pos])
				}
				else if (PLAYER_PIECE_TYPES[opponent].has(adjState)) {
					if (squareNode.captureNodeDests.hasOwnProperty(adjNode.pos)) {
						const captureDestNode = squareNode.captureNodeDests[adjNode.pos]
						if (this.SQUARES[captureDestNode.pos] == SQUARE_STATES.EMPTY) {
							mustCapture = true
							const captureDestNode = squareNode.captureNodeDests[adjNode.pos]
							const newCaptureActions = this.getActionsFromNodeCapture(captureDestNode, opponent, direction, [adjNode.pos])
							newCaptureActions.forEach(capturePath => capturePath.unshift(squareNode.pos))
							captureActions = captureActions.concat(newCaptureActions)
						}
					}
				}
			}
		}
		return [mustCapture, mustCapture ? captureActions : moveActions]
	}

	/**
	 * @param {SquareNode} squareNode
	 * @param {number} opponent
	 * @param {number} direction
	 * @param {Array} capturedList
	 */
	getActionsFromNodeCapture(squareNode, opponent, direction, capturedList) {
		let actions = []
		if ((this.SQUARES_PER_ROW <= squareNode.pos && squareNode.pos < this.NUM_SQUARES-this.SQUARES_PER_ROW) || direction == 0) {
			for (let adjInd = 0; adjInd < squareNode.adjacentNodes.length; ++adjInd) {
				const adjNode = squareNode.adjacentNodes[adjInd]
				const movDir = adjNode.pos - squareNode.pos
				if ((direction > 0 && movDir > 0) || (direction < 0 && movDir < 0) || direction == 0) {
					const adjState = this.SQUARES[adjNode.pos]
					if (PLAYER_PIECE_TYPES[opponent].has(adjState) && !capturedList.includes(adjNode.pos)) {
						if (squareNode.captureNodeDests.hasOwnProperty(adjNode.pos)) {
							const captureDestNode = squareNode.captureNodeDests[adjNode.pos]
							if (this.SQUARES[captureDestNode.pos] == SQUARE_STATES.EMPTY) {
								const captureActions = this.getActionsFromNodeCapture(captureDestNode, opponent, direction, capturedList.concat([adjNode.pos]))
								actions = actions.concat(captureActions)
							}
						}
					}
				}
			}
		}
		return (actions.length == 0) ? [capturedList.concat([squareNode.pos])] : actions
	}

	/**
	 * @param {Array} actionPath 
	 * @returns 
	 */
	convertFastActionPathToFormal(actionPath) {
		if (actionPath.length > 2) {
			let formalPath = [actionPath[0]]
			for (let i = 1; i < actionPath.length-1; ++i) {
				formalPath[i] = this.SQUARE_NODES[formalPath[i-1]].captureNodeDests[actionPath[i]].pos
			}
			return formalPath
		}
		return actionPath
	}
	/**
	 * @param {Array} actionPath 
	 * @returns 
	 */
	convertFormalToFastActionPath(formalPath) {
		if (formalPath.length > 2) {
			let actionPath = [formalPath[0]]
			for (let i = 1; i < formalPath.length; ++i) {
				actionPath[i] = this.SQUARE_NODES[formalPath[i-1]].capturedNodesFromDest[formalPath[i]].pos
			}
			actionPath[formalPath.length] = formalPath[formalPath.length-1]
			return actionPath
		}
		return formalPath
	}
	
	internalPosToExternalPos() {

	}

	/**
	 * @param {String} boardState 
	 */
	setState(boardState) {
		this.SQUARES.fill(SQUARE_STATES.EMPTY)
		this.turn = parseInt(boardState.charAt(0))

		let piece_type = 0
		let curPlayer = PLAYERS.A
		let playerPieceInd = 0
		for (let char_ind = 1; char_ind < boardState.length; ++char_ind) {
			let char = boardState.charAt(char_ind)
			if (char === this.STATE_SEP) {
				++piece_type
				if (curPlayer == PLAYERS.A && B_PIECE_TYPES.has(piece_type)) {
					this.playerPiecesPos[curPlayer][playerPieceInd] = REMOVED_PIECE
					curPlayer = PLAYERS.B
					playerPieceInd = 0
				}
			}
			else {
				let pos = BASE32_DECODE[char]
				this.SQUARES[pos] = piece_type
				this.playerPiecesPos[curPlayer][playerPieceInd++] = pos
			}
		}
		this.playerPiecesPos[curPlayer][playerPieceInd] = REMOVED_PIECE
	}
	getState() {
		let piecesByTypes = [
			[],
			[],
			[],
			[]
		]
		
		for (let i = 0; i < this.NUM_SQUARES; ++i) {
			let square_state = this.SQUARES[i]
			if (square_state != SQUARE_STATES.EMPTY) {
				piecesByTypes[square_state].push(BASE32_ENCODE[i])
			}
		}
		return this.turn.toString() + piecesByTypes.map(piece_type => piece_type.join('')).join(this.STATE_SEP)
	}
	removePiece(pos) {
		const piece_type = this.SQUARES[pos]
		const player = PLAYER_PIECE_TYPES[PLAYERS.A].has(piece_type) ? PLAYERS.A : PLAYERS.B
		const piecesPos = this.playerPiecesPos[player]
		const pieceInd = piecesPos.indexOf(pos) // Probably should use binary search here
		piecesPos[pieceInd] = REMOVED_PIECE
		// Shift removed piece over
		for (let i = pieceInd; piecesPos[i+1] != REMOVED_PIECE; ++i) {
			piecesPos[i] = piecesPos[i + 1]
			piecesPos[i + 1] = REMOVED_PIECE
		}
		this.SQUARES[pos] = SQUARE_STATES.EMPTY
	}

	moveInternal(player, action) {
		// Remove each capture
		for (let i = 1; i < action.length-1; ++i) {
			const opponent = OTHER_PLAYER[player]
			const capturedPos = action[i]
			const piecesPosOpp = this.playerPiecesPos[opponent]
			const capturedInd = piecesPosOpp.indexOf(capturedPos) // Probably should use binary search here
			piecesPosOpp[capturedInd] = REMOVED_PIECE
			// Shift removed piece over
			for (let i = capturedInd; piecesPosOpp[i+1] != REMOVED_PIECE; ++i) {
				piecesPosOpp[i] = piecesPosOpp[i + 1]
				piecesPosOpp[i + 1] = REMOVED_PIECE
			}
			this.SQUARES[capturedPos] = SQUARE_STATES.EMPTY
		}
		// Move piece
		const startPos = action[0]
		const endPos = action[action.length-1]
		this.SQUARES[endPos] = this.SQUARES[startPos]
		this.SQUARES[startPos] = SQUARE_STATES.EMPTY
		const piecesPos = this.playerPiecesPos[player]
		let pieceInd = piecesPos.indexOf(startPos) // Probably should use binary search here
		piecesPos[pieceInd] = endPos

		// Now sort because the state must be compared to similar states
		while (0 < pieceInd && piecesPos[pieceInd-1] > endPos) {
			piecesPos[pieceInd] = piecesPos[pieceInd-1]
			piecesPos[--pieceInd] = endPos
		}
		while (pieceInd < piecesPos.length && endPos > piecesPos[pieceInd+1]) {
			piecesPos[pieceInd] = piecesPos[pieceInd+1]
			piecesPos[++pieceInd] = endPos
		}

		// King the moved piece if it is on the opponents kings row
		if (endPos < this.SQUARES_PER_ROW && player == PLAYERS.B) {
			this.SQUARES[endPos] = SQUARE_STATES.B_KING
		}
		else if (endPos >= this.NUM_SQUARES-this.SQUARES_PER_ROW && player == PLAYERS.A) {
			this.SQUARES[endPos] = SQUARE_STATES.A_KING
		}

		this.turn = OTHER_PLAYER[this.turn]
	}

	move(startPos, endPos) {
		const player = this.turn
		const actions = this.getLegalActions(player)
		let action = undefined
		for (let i = 0; i < actions.length; ++i) {
			if (actions[i][0] == startPos && actions[i][actions[i].length-1] == endPos) {
				action = actions[i]
				break
			}
		}
		if (action) {
			this.moveInternal(player, action)
			return action
		}
		return false
	}

	/**
	 * @param {number} row 
	 * @param {number} col 
	 */
	getPos(row, col) {
		return row * this.SQUARES_PER_ROW + Math.floor(col/2)
	}

	getRow(pos) {
		return Math.floor(pos / this.SQUARES_PER_ROW)
	}

	toString() {
		const charArray = new Array(this.SIDE_LEN).fill(0).map(() => new Array(this.SIDE_LEN))
		let i = 0
		const SEP = '_'
		for (let row = 0; row < this.SIDE_LEN; ++row) {
			let playableSquareOffset = row % 2
			for (let col = 0; col < this.SIDE_LEN; ++col, ++i) {
				let isPlayableSquare = (i + playableSquareOffset) % 2 == 0
				charArray[row][col] = isPlayableSquare ? SEP : SQUARE_STATES_TO_STRING[this.SQUARES[Math.floor(i / 2)]]
			}
		}
		return charArray.map(row => row.join(' ')).join('\n')
	}

	getWinner() {
		// Test if any player has 0 pieces left
		for (let i = 0; i < this.playerPiecesPos.length; ++i) {
			if (this.playerPiecesPos[i][0] == REMOVED_PIECE) {
				return OTHER_PLAYER[i]
			}
		}
		// Test if the player who's turn it is has any actions left
		if (this.getLegalActions(this.turn).length <= 0) {
			return OTHER_PLAYER[this.turn]
		}
		return -1
	}
}
