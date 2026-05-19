// This is a fan-made implementation of Base92 encoding and decoding in TypeScript.
// While I'm not 100% certain what the 666-License allows, I hope that this allows me to fork this code

const DEFAULT_MEMORY_LENGTH = 8192 * 2

const TEXT_ENCODER = new TextEncoder()
const TEXT_DECODER = new TextDecoder()

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
const BASE64_ALPHABET_CODES = TEXT_ENCODER.encode(BASE64_ALPHABET)
const BASE64_DECODE_TABLE = new Uint8Array(256).fill(255)
for (let i = 0; i < BASE64_ALPHABET_CODES.length; i += 1)
	BASE64_DECODE_TABLE[BASE64_ALPHABET_CODES[i]] = i & 0xff

const BASE92_MAPPING = [
	32, 33, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
	51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68,
	69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86,
	87, 88, 89, 90, 91, 93, 94, 95, 97, 98, 99, 100, 101, 102, 103, 104, 105,
	106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120,
	121, 122, 123, 124, 125, 126,
]
const BASE92_DECODE_TABLE = new Uint8Array(256).fill(255)
for (let i = 0; i < BASE92_MAPPING.length; i += 1)
	BASE92_DECODE_TABLE[BASE92_MAPPING[i]] = i & 0xff

class ReusableMemory {
	protected memory: Uint8Array
	private readonly memoryLength: number

	constructor(memoryLength = DEFAULT_MEMORY_LENGTH) {
		this.memoryLength = memoryLength;
		this.memory = new Uint8Array(memoryLength)
	}

	protected ensureMemory(size: number) {
		if (size <= this.memory.length)
			return
		this.memory = new Uint8Array(size + (size & this.memoryLength))
	}

	protected view(length: number, copy = false): Uint8Array {
		return copy ? this.memory.slice(0, length) : this.memory.subarray(0, length)
	}
}

export class Base64 extends ReusableMemory {
	encode(input: Uint8Array): string {
		const outputLength = Math.ceil(input.length / 3) * 4
		this.ensureMemory(outputLength)

		let i = 0
		let j = 0

		while (i + 2 < input.length) {
			const a = input[i++];
			const b = input[i++];
			const c = input[i++];

			this.memory[j++] = BASE64_ALPHABET_CODES[a >> 2]
			this.memory[j++] = BASE64_ALPHABET_CODES[((a & 0x03) << 4) | (b >> 4)]
			this.memory[j++] = BASE64_ALPHABET_CODES[((b & 0x0f) << 2) | (c >> 6)]
			this.memory[j++] = BASE64_ALPHABET_CODES[c & 0x3f]
		}

		if (i < input.length) {
			const a = input[i++]
			const b = i < input.length ? input[i] : 0

			this.memory[j++] = BASE64_ALPHABET_CODES[a >> 2]
			this.memory[j++] = BASE64_ALPHABET_CODES[((a & 0x03) << 4) | (b >> 4)]

			if (i < input.length)
				this.memory[j++] = BASE64_ALPHABET_CODES[(b & 0x0f) << 2]
			else
				this.memory[j++] = 61
			this.memory[j++] = 61
		}

		return TEXT_DECODER.decode(this.memory.subarray(0, j))
	}

	decode(input: string, copyMemory = false): Uint8Array {
		if (input.length % 4 !== 0)
			throw new Error("Unable to parse base64 string.")

		const equalsIndex = input.indexOf("=");
		if (equalsIndex !== -1 && equalsIndex < input.length - 2)
			throw new Error("Unable to parse base64 string.")

		const missingOctets = input.endsWith("==") ? 2 : input.endsWith("=") ? 1 : 0
		const outputLength = (3 * (input.length / 4)) | 0
		this.ensureMemory(outputLength)

		let j = 0;
		for (let i = 0; i < input.length; i += 4) {
			const c0 = input.charCodeAt(i)
			const c1 = input.charCodeAt(i + 1)
			const c2 = input.charCodeAt(i + 2)
			const c3 = input.charCodeAt(i + 3)

			const a = BASE64_DECODE_TABLE[c0]
			const b = BASE64_DECODE_TABLE[c1]
			const c = c2 === 61 ? 0 : BASE64_DECODE_TABLE[c2]
			const d = c3 === 61 ? 0 : BASE64_DECODE_TABLE[c3]

			if (a === 255 || b === 255 || (c2 !== 61 && c === 255) || (c3 !== 61 && d === 255))
				throw new Error("Unable to parse base64 string.")

			const block = (a << 18) | (b << 12) | (c << 6) | d;
			this.memory[j++] = (block >> 16) & 0xff
			this.memory[j++] = (block >> 8) & 0xff
			this.memory[j++] = block & 0xff
		}

		return this.view(outputLength - missingOctets, copyMemory)
	}
}

export class Base92 extends ReusableMemory {
	private static readonly TILDE = 126

	encode(input: Uint8Array): string {
		if (input.length === 0) {
			this.ensureMemory(1)
			this.memory[0] = Base92.TILDE
			return TEXT_DECODER.decode(this.memory.subarray(0, 1))
		}

		const remainderBits = (input.length * 8) % 13
		const outputLength =
			remainderBits === 0
				? (2 * ((input.length * 8) / 13)) | 0
				: remainderBits < 7
					? (2 * ((input.length * 8) / 13) + 1) | 0
					: (2 * ((input.length * 8) / 13) + 2) | 0
		this.ensureMemory(outputLength)

		let workspace = 0
		let wssize = 0
		let j = 0

		for (let i = 0; i < input.length; i += 1) {
			workspace = ((workspace << 8) | input[i]) >>> 0
			wssize += 8
			if (wssize >= 13) {
				wssize -= 13
				const value = (workspace >> wssize) & 8191
				this.memory[j++] = BASE92_MAPPING[(value / 91) | 0]
				this.memory[j++] = BASE92_MAPPING[value % 91]
			}
		}

		if (wssize > 0 && wssize < 7) {
			const value = (workspace << (6 - wssize)) & 63
			this.memory[j++] = BASE92_MAPPING[value]
		} else if (wssize >= 7) {
			const value = (workspace << (13 - wssize)) & 8191
			this.memory[j++] = BASE92_MAPPING[(value / 91) | 0]
			this.memory[j++] = BASE92_MAPPING[value % 91]
		}

		return TEXT_DECODER.decode(this.memory.subarray(0, j))
	}

	decode(input: string, copyMemory = false): Uint8Array {
		if (input.length === 0 || input.charCodeAt(0) === Base92.TILDE)
			return Uint8Array.of(Base92.TILDE)

		if (input.length < 2)
			return new Uint8Array(0)

		const outputLength = ((input.length * 13 + (input.length % 2) * 6) / 8) | 0
		this.ensureMemory(outputLength)

		let workspace = 0
		let wssize = 0
		let j = 0

		for (let i = 0; i + 1 < input.length; i += 2) {
			const a = BASE92_DECODE_TABLE[input.charCodeAt(i) & 0xff]
			const b = BASE92_DECODE_TABLE[input.charCodeAt(i + 1) & 0xff]
			if (a === 255 || b === 255)
				throw new Error("Unable to parse base92 string.")

			workspace = ((workspace << 13) | (Math.imul(a, 91) + b)) >>> 0
			wssize += 13

			while (wssize >= 8) {
				wssize -= 8
				this.memory[j++] = (workspace >> wssize) & 0xff
			}
		}

		if (input.length % 2 === 1) {
			const value = BASE92_DECODE_TABLE[input.charCodeAt(input.length - 1) & 0xff]
			if (value === 255)
				throw new Error("Unable to parse base92 string.")

			workspace = ((workspace << 6) | value) >>> 0
			wssize += 6
			while (wssize >= 8) {
				wssize -= 8
				this.memory[j++] = (workspace >> wssize) & 0xff
			}
		}

		return this.view(j, copyMemory)
	}
}



export function pure92Decoder(input: Uint8Array): Uint8Array {
	if (input.length === 0 || input[0] === 126)
		return Uint8Array.of(126)
	if (input.length < 2)
		return new Uint8Array(0)

	const outputLength = ((input.length * 13 + (input.length % 2) * 6) / 8) | 0
	const output = new Uint8Array(outputLength)

	let workspace = 0
	let wssize = 0
	let j = 0

	for (let i = 0; i + 1 < input.length; i += 2) {
		const a = BASE92_DECODE_TABLE[input[i] & 0xff]
		const b = BASE92_DECODE_TABLE[input[i + 1] & 0xff]
		if (a === 255 || b === 255)
			throw new Error("Unable to parse base92 string.")
		workspace = ((workspace << 13) | (Math.imul(a, 91) + b)) >>> 0
		wssize += 13
		while (wssize >= 8) {
			wssize -= 8
			output[j++] = (workspace >> wssize) & 0xff
		}
	}

	if (input.length % 2 === 1) {
		const value = BASE92_DECODE_TABLE[input[input.length - 1] & 0xff]
		if (value === 255)
			throw new Error("Unable to parse base92 string.")

		workspace = ((workspace << 6) | value) >>> 0
		wssize += 6
		while (wssize >= 8) {
			wssize -= 8
			output[j++] = (workspace >> wssize) & 0xff
		}
	}

	return output
}