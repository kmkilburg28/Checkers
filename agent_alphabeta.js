class AgentAlphaBeta extends Agent {
	constructor(evaluationFunction, cutoffFunction) {
		super()
		this.board = new LogicBoard()
		this.evaluate = evaluationFunction
		this.isCutoff = cutoffFunction
		this.transpositionTable = {}
	}

	/**
	 * @param {string} currentState 
	 * @returns 
	 */
	getAction(currentState) {
		return [true, this.AlphaBetaSearch(currentState)]
	}

	bind(player, game) {
		this.player = player
	}

	/**
	 * @param {string} state 
	 */
	AlphaBetaSearch(state) {
		this.board.setState(state)
		this.transpositionTable = {}
		let [value, move] = this.MaxValue(state, -Infinity, Infinity, 0)
		this.transpositionTable = {}
		return move
	}

	/**
	 * @param {string} state 
	 * @param {number} alpha best_value must be at least alpha
	 * @param {number} beta best_value must be at most beta
	 * @param {number} depth 
	 * @returns 
	 */
	MaxValue(state, alpha, beta, depth) {
		if (this.board.getWinner() >= 0) { // Other player's move won
			return [-WIN_SCORE+depth, null]
		}
		else if (this.isCutoff(this.board, depth)) {
			return [this.evaluate(this.board, this.player), null]
		}
		let best_value = -Infinity
		let best_move = null
		const actions = this.board.getLegalActions(this.player)
		for (let i = 0; i < actions.length; ++i) {
			this.board.setState(state)
			this.board.moveInternal(this.player, actions[i])
			const curState = this.board.getState()
			let value, move
			if (!this.transpositionTable.hasOwnProperty(curState)) {
				this.transpositionTable[curState] = {
					value : 0,
					depth : Infinity
				}
			}
			if (this.transpositionTable[curState].depth <= depth) {
				value = this.transpositionTable[curState].value
			}
			else {
				[value, move] = this.MinValue(curState, alpha, beta, depth+1)
				this.transpositionTable[curState].value = value
				this.transpositionTable[curState].depth = depth
			}

			if (best_value < value) {
				best_value = value
				best_move = actions[i]
				if (alpha < value) {
					alpha = value
				}
			}
			if (beta <= best_value) {
				return [best_value, best_move]
			}
		}
		return [best_value, best_move]
	}
	MinValue(state, alpha, beta, depth) {
		if (this.board.getWinner() >= 0) { // Other player's move won
			return [WIN_SCORE-depth, null]
		}
		else if (this.isCutoff(this.board, depth)) {
			return [this.evaluate(this.board, this.player), null]
		}
		let best_value = Infinity
		let best_move = null
		const actions = this.board.getLegalActions(OTHER_PLAYER[this.player])
		for (let i = 0; i < actions.length; ++i) {
			this.board.setState(state)
			this.board.moveInternal(OTHER_PLAYER[this.player], actions[i])
			const curState = this.board.getState()
			let value, move
			if (!this.transpositionTable.hasOwnProperty(curState)) {
				this.transpositionTable[curState] = {
					value : 0,
					depth : Infinity
				}
			}
			if (this.transpositionTable[curState].depth <= depth) {
				value = this.transpositionTable[curState].value
			}
			else {
				[value, move] = this.MaxValue(curState, alpha, beta, depth+1)
				this.transpositionTable[curState].value = value
				this.transpositionTable[curState].depth = depth
			}

			if (value < best_value) {
				best_value = value
				best_move = actions[i]
				if (value < beta) {
					beta = value
				}
			}
			if (best_value <= alpha) {
				return [best_value, best_move]
			}
		}
		return [best_value, best_move]
	}
}

/**
 * @param {number} depth 
 */
function getDepthCutoffFunction(max_depth) {
	/**
	 * @param {LogicBoard} board 
	 * @param {number} depth 
	 */
	const cutoffFunction = (board, depth) => {
		return depth > max_depth
	}
	return cutoffFunction
}
/**
 * @param {number} depth 
 */
function getDepthCutoffEndgameChangeFunction(max_depth, max_depth_end_game) {
	/**
	 * @param {LogicBoard} board 
	 * @param {number} depth 
	 */
	const cutoffFunction = (board, depth) => {
		let isEndGame = board.playerPiecesPos[PLAYERS.A][2] === REMOVED_PIECE ||
						board.playerPiecesPos[PLAYERS.B][2] === REMOVED_PIECE
		return depth > (isEndGame ? max_depth_end_game : max_depth)
	}
	return cutoffFunction
}

/**
 * @param {number} MAN_VALUE 
 * @param {number} KING_VALUE 
 * @returns 
 */
function getMaterialAdvantageFunction(MAN_VALUE, KING_VALUE) {
	/**
	 * @param {LogicBoard} board 
	 * @returns 
	 */
	return (board, player) => {
		const opp = OTHER_PLAYER[player]
		let points = 0
	
		const curPlayerPieces = board.playerPiecesPos[player]
		for (let i = 0; curPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[curPlayerPieces[i]]
			points += (PLAYER_MAN_ENUM[player] === piece_type) ? MAN_VALUE : KING_VALUE
		}
		const oppPlayerPieces = board.playerPiecesPos[opp]
		for (let i = 0; oppPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[oppPlayerPieces[i]]
			points -= (PLAYER_MAN_ENUM[opp] === piece_type) ? MAN_VALUE : KING_VALUE
		}
		return points
	}
}
/**
 * @param {number} MAN_VALUE 
 * @param {number} KING_VALUE 
 * @returns 
 */
function getPercentageMaterialAdvantageFunction(MAN_VALUE, KING_VALUE) {
	/**
	 * @param {LogicBoard} board 
	 * @returns 
	 */
	return (board, player) => {
		const opp = OTHER_PLAYER[player]
	
		const curPlayerPieces = board.playerPiecesPos[player]
		let curPlayerPoints = 0
		for (let i = 0; curPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[curPlayerPieces[i]]
			curPlayerPoints += (PLAYER_MAN_ENUM[player] === piece_type) ? MAN_VALUE : KING_VALUE
		}
		const oppPlayerPieces = board.playerPiecesPos[opp]
		let oppPlayerPoints = 0
		for (let i = 0; oppPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[oppPlayerPieces[i]]
			oppPlayerPoints += (PLAYER_MAN_ENUM[opp] === piece_type) ? MAN_VALUE : KING_VALUE
		}
		return curPlayerPoints / (curPlayerPoints + oppPlayerPoints)
	}
}

/**
 * @param {number} MAN_VALUE 
 * @param {number} KING_VALUE 
 * @returns 
 */
 function getMaterialAdvantageFunctionPlusCenterControlAndAnchorPieces(MAN_VALUE, KING_VALUE) {
	/**
	 * @param {LogicBoard} board 
	 * @returns 
	 */
	return (board, player) => {
		const opp = OTHER_PLAYER[player]
		let points = 0
	
		const curPlayerPieces = board.playerPiecesPos[player]
		for (let i = 0; curPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[curPlayerPieces[i]]
			points += (PLAYER_MAN_ENUM[player] === piece_type) ? MAN_VALUE : KING_VALUE
		}
		const oppPlayerPieces = board.playerPiecesPos[opp]
		for (let i = 0; oppPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[oppPlayerPieces[i]]
			points -= (PLAYER_MAN_ENUM[opp] === piece_type) ? MAN_VALUE : KING_VALUE
		}

		// Points for having anchors
		points += (player == PLAYERS.A ? 1 : -1) * (
		    ((board.SQUARES[0]  == SQUARE_STATES.A_MAN ? 1 : 0) +
		     (board.SQUARES[2]  == SQUARE_STATES.A_MAN ? 1 : 0)) - 
		    ((board.SQUARES[29] == SQUARE_STATES.B_MAN ? 1 : 0) + 
		     (board.SQUARES[31] == SQUARE_STATES.B_MAN ? 1 : 0))
		)

		// Points for having center protected
		points += (player == PLAYERS.A ? 1 : -1) * (
		    ((A_PIECE_TYPES.has(board.SQUARES[14]) ? 1 : 0) +
		     (A_PIECE_TYPES.has(board.SQUARES[17]) ? 1 : 0)) -
		    ((B_PIECE_TYPES.has(board.SQUARES[14]) ? 1 : 0) +
		     (B_PIECE_TYPES.has(board.SQUARES[17]) ? 1 : 0))
		)

		return points
	}
}
/**
 * @param {number} MAN_VALUE 
 * @param {number} KING_VALUE 
 * @returns 
 */
 function getMaterialAdvantageFunctionPlusCenterControl(MAN_VALUE, KING_VALUE) {
	/**
	 * @param {LogicBoard} board 
	 * @returns 
	 */
	return (board, player) => {
		const opp = OTHER_PLAYER[player]
		let points = 0
	
		const curPlayerPieces = board.playerPiecesPos[player]
		for (let i = 0; curPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[curPlayerPieces[i]]
			points += (PLAYER_MAN_ENUM[player] === piece_type) ? MAN_VALUE : KING_VALUE
		}
		const oppPlayerPieces = board.playerPiecesPos[opp]
		for (let i = 0; oppPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[oppPlayerPieces[i]]
			points -= (PLAYER_MAN_ENUM[opp] === piece_type) ? MAN_VALUE : KING_VALUE
		}

		// Points for having anchors
		points += (player == PLAYERS.A ? 1 : -1) * (
		    ((board.SQUARES[0]  == SQUARE_STATES.A_MAN ? 1 : 0) +
		     (board.SQUARES[2]  == SQUARE_STATES.A_MAN ? 1 : 0)) - 
		    ((board.SQUARES[29] == SQUARE_STATES.B_MAN ? 1 : 0) + 
		     (board.SQUARES[31] == SQUARE_STATES.B_MAN ? 1 : 0))
		)

		// Points for having center protected
		points += (player == PLAYERS.A ? 1 : -1) * (
		    ((A_PIECE_TYPES.has(board.SQUARES[14]) ? 1 : 0) +
		     (A_PIECE_TYPES.has(board.SQUARES[17]) ? 1 : 0)) -
		    ((B_PIECE_TYPES.has(board.SQUARES[14]) ? 1 : 0) +
		     (B_PIECE_TYPES.has(board.SQUARES[17]) ? 1 : 0))
		)

		return points
	}
}
/**
 * @param {number} MAN_VALUE 
 * @param {number} KING_VALUE 
 * @returns 
 */
 function getMaterialAdvantageFunctionPlusAnchorPieces(MAN_VALUE, KING_VALUE) {
	/**
	 * @param {LogicBoard} board 
	 * @returns 
	 */
	return (board, player) => {
		const opp = OTHER_PLAYER[player]
		let points = 0
	
		const curPlayerPieces = board.playerPiecesPos[player]
		for (let i = 0; curPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[curPlayerPieces[i]]
			points += (PLAYER_MAN_ENUM[player] === piece_type) ? MAN_VALUE : KING_VALUE
		}
		const oppPlayerPieces = board.playerPiecesPos[opp]
		for (let i = 0; oppPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[oppPlayerPieces[i]]
			points -= (PLAYER_MAN_ENUM[opp] === piece_type) ? MAN_VALUE : KING_VALUE
		}

		// Points for having anchors
		points += (player == PLAYERS.A ? 1 : -1) * (
		    ((board.SQUARES[0]  == SQUARE_STATES.A_MAN ? 1 : 0) +
		     (board.SQUARES[2]  == SQUARE_STATES.A_MAN ? 1 : 0)) - 
		    ((board.SQUARES[29] == SQUARE_STATES.B_MAN ? 1 : 0) + 
		     (board.SQUARES[31] == SQUARE_STATES.B_MAN ? 1 : 0))
		)

		return points
	}
}
/**
 * @param {number} MAN_VALUE 
 * @param {number} KING_VALUE 
 * @returns 
 */
 function getMaterialAdvantageFunctionPlusConnectedPieces(MAN_VALUE, KING_VALUE) {
	/**
	 * @param {LogicBoard} board 
	 * @returns 
	 */
	return (board, player) => {
		const opp = OTHER_PLAYER[player]
		let points = 0
	
		const curPlayerPieces = board.playerPiecesPos[player]
		for (let i = 0; curPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[curPlayerPieces[i]]
			points += (PLAYER_MAN_ENUM[player] === piece_type) ? MAN_VALUE : KING_VALUE
		}
		const oppPlayerPieces = board.playerPiecesPos[opp]
		for (let i = 0; oppPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[oppPlayerPieces[i]]
			points -= (PLAYER_MAN_ENUM[opp] === piece_type) ? MAN_VALUE : KING_VALUE
		}

		for (let i = 0; curPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const adjPositions = board.SQUARE_NODES[curPlayerPieces[i]].adjacentNodes.map(square_node => square_node.pos)
			adjPositions.forEach(pos => {
				for (let i = 0; curPlayerPieces[i] != REMOVED_PIECE; ++i) {
					if (pos === curPlayerPieces[i]) {
						points += 0.25
					}
				}
			});
		}
		for (let i = 0; oppPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const adjPositions = board.SQUARE_NODES[oppPlayerPieces[i]].adjacentNodes.map(square_node => square_node.pos)
			adjPositions.forEach(pos => {
				for (let i = 0; oppPlayerPieces[i] != REMOVED_PIECE; ++i) {
					if (pos === oppPlayerPieces[i]) {
						points -= 0.25
					}
				}
			});
		}

		return points
	}
}
/**
 * @param {number} MAN_VALUE 
 * @param {number} KING_VALUE 
 * @returns 
 */
 function getMaterialAdvantageFunctionMinusCornerPiece(MAN_VALUE, KING_VALUE) {
	/**
	 * @param {LogicBoard} board 
	 * @returns 
	 */
	return (board, player) => {
		const opp = OTHER_PLAYER[player]
		let points = 0
	
		const curPlayerPieces = board.playerPiecesPos[player]
		for (let i = 0; curPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[curPlayerPieces[i]]
			points += (PLAYER_MAN_ENUM[player] === piece_type) ? MAN_VALUE : KING_VALUE
		}
		const oppPlayerPieces = board.playerPiecesPos[opp]
		for (let i = 0; oppPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[oppPlayerPieces[i]]
			points -= (PLAYER_MAN_ENUM[opp] === piece_type) ? MAN_VALUE : KING_VALUE
		}

		// Points for get corner piece out
		points -= (player === PLAYERS.A ? 1 : -1) * (
		    ((board.SQUARES[3]  === SQUARE_STATES.A_MAN ? 1 : 0) - 
		     (board.SQUARES[28] === SQUARE_STATES.B_MAN ? 1 : 0))
		)

		return points
	}
}
/**
 * @param {number} MAN_VALUE 
 * @param {number} KING_VALUE 
 * @returns 
 */
 function getMaterialAdvantageFunctionMinusCornerPlusAnchors(MAN_VALUE, KING_VALUE) {
	/**
	 * @param {LogicBoard} board 
	 * @returns 
	 */
	return (board, player) => {
		const opp = OTHER_PLAYER[player]
		let points = 0
	
		const curPlayerPieces = board.playerPiecesPos[player]
		for (let i = 0; curPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[curPlayerPieces[i]]
			points += (PLAYER_MAN_ENUM[player] === piece_type) ? MAN_VALUE : KING_VALUE
		}
		const oppPlayerPieces = board.playerPiecesPos[opp]
		for (let i = 0; oppPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[oppPlayerPieces[i]]
			points -= (PLAYER_MAN_ENUM[opp] === piece_type) ? MAN_VALUE : KING_VALUE
		}

		// Points for get corner piece out
		points -= (player === PLAYERS.A ? 1 : -1) * (
		    ((board.SQUARES[3]  === SQUARE_STATES.A_MAN ? 1 : 0) - 
		     (board.SQUARES[28] === SQUARE_STATES.B_MAN ? 1 : 0))
		)
		// Points for having anchors
		points += (player == PLAYERS.A ? 1 : -1) * (
		    ((board.SQUARES[0]  == SQUARE_STATES.A_MAN ? 1 : 0) +
		     (board.SQUARES[2]  == SQUARE_STATES.A_MAN ? 1 : 0)) - 
		    ((board.SQUARES[29] == SQUARE_STATES.B_MAN ? 1 : 0) + 
		     (board.SQUARES[31] == SQUARE_STATES.B_MAN ? 1 : 0))
		)

		return points
	}
}
/**
 * @param {number} MAN_VALUE 
 * @param {number} KING_VALUE 
 * @returns 
 */
 function getMaterialCenterAnchorNoCornerAdvantageFunction(MAN_VALUE, KING_VALUE) {
	/**
	 * @param {LogicBoard} board 
	 * @returns 
	 */
	return (board, player) => {
		const opp = OTHER_PLAYER[player]
		let points = 0

		const curPlayerPieces = board.playerPiecesPos[player]
		const oppPlayerPieces = board.playerPiecesPos[opp]
		for (let i = 0; curPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[curPlayerPieces[i]]
			points += (PLAYER_MAN_ENUM[player] === piece_type) ? MAN_VALUE : KING_VALUE
		}
		for (let i = 0; oppPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[oppPlayerPieces[i]]
			points -= (PLAYER_MAN_ENUM[opp] === piece_type) ? MAN_VALUE : KING_VALUE
		}
	
		for (let i = 0; curPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const row = board.getRow(curPlayerPieces[i])
			const col = curPlayerPieces[i] - row * board.SQUARES_PER_ROW
			const mid = (board.SIDE_LEN - 1)/2
			const manhattanDistance = Math.abs(mid - row) + Math.abs(mid - col)
			points += 1 / manhattanDistance
		}
		for (let i = 0; oppPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const row = board.getRow(oppPlayerPieces[i])
			const col = oppPlayerPieces[i] - row * board.SQUARES_PER_ROW
			const mid = (board.SIDE_LEN - 1)/2
			const manhattanDistance = Math.abs(mid - row) + Math.abs(mid - col)
			points -= 1 / manhattanDistance
		}

		// Points for get corner piece out
		points -= (player === PLAYERS.A ? 1 : -1) * (
		    ((board.SQUARES[3]  === SQUARE_STATES.A_MAN ? 1 : 0) - 
		     (board.SQUARES[28] === SQUARE_STATES.B_MAN ? 1 : 0))
		)
		// Points for having anchors
		points += (player == PLAYERS.A ? 1 : -1) * (
		    ((board.SQUARES[0]  == SQUARE_STATES.A_MAN ? 1 : 0) +
		     (board.SQUARES[2]  == SQUARE_STATES.A_MAN ? 1 : 0)) - 
		    ((board.SQUARES[29] == SQUARE_STATES.B_MAN ? 1 : 0) + 
		     (board.SQUARES[31] == SQUARE_STATES.B_MAN ? 1 : 0))
		)
		points += (player == PLAYERS.A ? 1 : -1) * (
		    (board.SQUARES[0]  == SQUARE_STATES.A_MAN &&
		     board.SQUARES[2]  == SQUARE_STATES.A_MAN ? 1 : 0) - 
		    (board.SQUARES[29] == SQUARE_STATES.B_MAN && 
		     board.SQUARES[31] == SQUARE_STATES.B_MAN ? 1 : 0)
		)
		points += (player == PLAYERS.A ? 1 : -1) * (
		    (board.SQUARES[0]  == SQUARE_STATES.A_MAN &&
		     board.SQUARES[4]  == SQUARE_STATES.A_MAN ? 1 : 0) - 
		    (board.SQUARES[27] == SQUARE_STATES.B_MAN && 
		     board.SQUARES[31] == SQUARE_STATES.B_MAN ? 1 : 0)
		)
		// Points for get corner piece out
		points -= (player === PLAYERS.A ? 1 : -1) * (
		    ((board.SQUARES[3]  === SQUARE_STATES.A_MAN ? 1 : 0) - 
		     (board.SQUARES[28] === SQUARE_STATES.B_MAN ? 1 : 0))
		)

		return points
	}
}

/**
 * @param {number} MAN_VALUE 
 * @param {number} KING_VALUE 
 * @returns 
 */
 function getPercentageMaterialAdvantageFunctionMinusCornerPiece(MAN_VALUE, KING_VALUE) {
	/**
	 * @param {LogicBoard} board 
	 * @returns 
	 */
	return (board, player) => {
		const opp = OTHER_PLAYER[player]
	
		const curPlayerPieces = board.playerPiecesPos[player]
		let curPlayerPoints = 0
		for (let i = 0; curPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[curPlayerPieces[i]]
			curPlayerPoints += (PLAYER_MAN_ENUM[player] === piece_type) ? MAN_VALUE : KING_VALUE
		}
		curPlayerPoints -= board.SQUARES[player === PLAYERS.A ? 3 : 28] === (player === PLAYERS.A ? SQUARE_STATES.A_MAN : SQUARE_STATES.B_MAN) ? 1 : 0
		const oppPlayerPieces = board.playerPiecesPos[opp]
		let oppPlayerPoints = 0
		for (let i = 0; oppPlayerPieces[i] != REMOVED_PIECE; ++i) {
			const piece_type = board.SQUARES[oppPlayerPieces[i]]
			oppPlayerPoints += (PLAYER_MAN_ENUM[opp] === piece_type) ? MAN_VALUE : KING_VALUE
		}
		oppPlayerPoints -= board.SQUARES[player === PLAYERS.A ? 28 : 3] === (player === PLAYERS.A ? SQUARE_STATES.A_MAN : SQUARE_STATES.B_MAN) ? 1 : 0
		return curPlayerPoints / (curPlayerPoints + oppPlayerPoints)
	}
}