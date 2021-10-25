class SquareNode {
	constructor(pos) {
		this.pos = pos
		this.adjacentNodes = []
		this.captureNodeDests = {}
		this.capturedNodesFromDest = {}
	}

	/**
	 * @param {SquareNode} node 
	 */
	addAdjacentNode(node) {
		if (!this.adjacentNodes.includes(node)) {
			this.adjacentNodes.push(node)
			node.addAdjacentNode(this)
		}
	}

	/**
	 * @param {number} adjPos 
	 * @param {SquareNode} node 
	 */
	addCaptureNodeDest(adjPos, node) {
		if (!this.captureNodeDests.hasOwnProperty(adjPos)) {
			this.captureNodeDests[adjPos] = node
			for (let i = 0; i < this.adjacentNodes.length; ++i) {
				if (this.adjacentNodes[i].pos == adjPos) {
					this.capturedNodesFromDest[node.pos] = this.adjacentNodes[i]
					break
				}
			}
			node.addCaptureNodeDest(adjPos, this)
		}
	}

	sortAdjacentNodes() {
		this.adjacentNodes = this.adjacentNodes.sort(
			(node1, node2) => node1.pos < node2.pos
		)
	}
}