class Agent {
	constructor(evaluationFunction, cutoffFunction) { }

	/**
	 * @param {string} currentState 
	 * @returns 
	 */
	getAction(currentState) {
		throw new Error("Method 'getAction()' must be implemented.")
	}

	/**
	 * @param {number} player 
	 */
	bind(player, game) { }
}
