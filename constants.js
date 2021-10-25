const BASE32_HEX = "0123456789ABCDEFGHIJKLMNOPQRSTUV"
const BASE32_ENCODE = BASE32_HEX.split('')
const BASE32_DECODE = []
BASE32_ENCODE.forEach((value, i) => {
	BASE32_DECODE[value] = i
})

const SQUARE_STATES = {
	A_MAN : 0,
	A_KING: 1,
	B_MAN : 2,
	B_KING: 3,
	EMPTY : 4
}
const SQUARE_STATES_TO_STRING = [
	'a',
	'A',
	'b',
	'B',
	'.'
]
const SQUARE_STATES_TO_CLASS = [
	'am',
	'ak',
	'bm',
	'bk',
	undefined
]
const PLAYER_COLOR = [ // Note that this is set manually as well in the CSS
	'red',
	'green'
]
const PLAYERS = {
	A: 0,
	B: 1
}
const OTHER_PLAYER = [
	PLAYERS.B,
	PLAYERS.A
]
const PLAYER_MAN_ENUM = [
	SQUARE_STATES.A_MAN,
	SQUARE_STATES.B_MAN
]
const NUM_PLAYERS = Object.keys(PLAYERS).length
const A_PIECE_TYPES = new Set([SQUARE_STATES.A_MAN, SQUARE_STATES.A_KING])
const B_PIECE_TYPES = new Set([SQUARE_STATES.B_MAN, SQUARE_STATES.B_KING])
const PLAYER_PIECE_TYPES = [
	A_PIECE_TYPES,
	B_PIECE_TYPES
]
const NUM_SQUARE_STATES = Object.keys(SQUARE_STATES).length
const REMOVED_PIECE = 255
const WIN_SCORE = Number.MAX_SAFE_INTEGER // Arbitrarily large, finite score

const ANIMATION_TIME = 250
