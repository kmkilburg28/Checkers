
const SELECT_AGENT_OPTIONS = {
	"User" : AgentUser,
	"Alpha-Beta AI" : AgentAlphaBeta,
}

const SELECT_EVAL_OPTIONS = {
	"Material Advantage" : getMaterialAdvantageFunction(2, 3),
	"Percent Total Material Advantage" : getPercentageMaterialAdvantageFunction(2, 3),
	"Material Advantage + (Simple) Game Strategy" : getMaterialCenterAnchorNoCornerAdvantageFunction(2, 3),
}

function defaultSetup() {
	for (let player = 0; player < 2; ++player) {
		const select_agent = document.getElementById('select_agent' + (player+1))
		const player_option_names = Object.keys(SELECT_AGENT_OPTIONS)
		for (let i = 0; i < player_option_names.length; ++i) {
			const option = document.createElement('option')
			option.text = player_option_names[i]
			option.value = player_option_names[i]
			if (player_option_names[i] === "Alpha-Beta AI") {
				option.selected = true
			}
			select_agent.appendChild(option)
		}

		const select_eval = document.getElementById('select_eval' + (player+1))
		const eval_option_names = Object.keys(SELECT_EVAL_OPTIONS)
		for (let i = 0; i < eval_option_names.length; ++i) {
			const option = document.createElement('option')
			option.text = eval_option_names[i]
			option.value = eval_option_names[i]
			if (player === 1 && eval_option_names[i] === "Percent Total Material Advantage") {
				option.selected = true
			}
			select_eval.appendChild(option)
		}

		/** @type {HTMLDivElement} */
		const ai_settings = document.getElementById('ai_settings' + (player+1))
		/**
		 * @param {InputEvent} e 
		 */
		const showAI = (e) => {
			ai_settings.style.visibility = (select_agent.value === "User") ? "hidden" : "visible"
		}
		select_agent.addEventListener('change', showAI)
		showAI()
	}

	const container = document.getElementById("div_pieces")
	const initial_state = getBoardStateFromURL()
	const game = new Game(container, initial_state)

	/** @type {HTMLButtonElement} */
	const start_button = document.getElementById('start_button')
	/**
	 * @param {MouseEvent} e 
	 */
	const startGameFunc = (e) => {
		e.target.removeEventListener('click', startGameFunc)
		e.target.disabled = true

		const agents = []
		for (let i = 0; i < 2; ++i) {
			const select_agent = document.getElementById('select_agent' + (i+1))
			const AgentClass = SELECT_AGENT_OPTIONS[select_agent.value]

			const select_eval = document.getElementById('select_eval' + (i+1))
			const evalFunc = SELECT_EVAL_OPTIONS[select_eval.value]

			const depth = document.getElementById('depth' + (i+1)).value

			const agent = new AgentClass(
				evalFunc,
				getDepthCutoffFunction(depth)
			)
			agents[i] = agent
		}

		game.setAgents(...agents)
		game.nextTurn()
	}
	start_button.addEventListener('click', startGameFunc)

	return game
}

defaultSetup()
