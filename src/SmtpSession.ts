import {Socket} from "net";
import {Loop, ILoopEvent} from "./Loop";
import * as t from "./types";

export class SmtpSession {
	private _nextBuilder: t.NextBuilderFunc;
	private _context: t.IContext;
	private _isData: boolean;

	constructor(config: { id: string, sock: Socket, nextBuilder: t.NextBuilderFunc }) {
		this._context = {
			id: config.id,
			sock: config.sock
		};
		this._nextBuilder = config.nextBuilder;
	}

	async process() {
		let loop = new Loop(this._context.sock);
		let ev: ILoopEvent;

		ev = { command: null }; // connect event
		do {
			let input: t.IInput = {};
			if ("command" in ev) {
				if (ev.command == null)
					input.connect = true;
				else {
					input.command = {
						name: getCommand(ev.command),
						raw: ev.command
					};
					console.log(`[${this._context.id}] >> ${input.command.raw}`);
				}
			}
			else if ("data" in ev || "eod" in ev) {
				input.data = {
					data: ev.data,
					eod: ev.eod
				};
			}
			else if (ev.overflow) {
				input.command = {
					name: null,
					raw: null,
					overflow: true
				};
				console.log(`[${this._context.id}] >> <truncate command due to overflow>`);
			}
			else
				throw new Error("Oops!");

			let reply: t.IReply = { code: 0 };
			let next = this._nextBuilder(this._context, input, reply);  // build middleware call chain
			await next(); // run middleware

			if (input.command) {
				if (input.command.name === "data" && reply.code === 354)
					this._isData = true;
			}
			else if (input.data) {
				if (input.data.eod)
					this._isData = false;
			}

			if (reply.code) {
				console.log(`[${this._context.id}] << ${reply.code} ${reply.text}`);
				this._context.sock.write(`${reply.code} ${reply.text}\r\n`, "ascii");
			}

			if (this._context.done || reply.code === 221 || reply.code === 421)
				break;
		} while (ev = await loop.next({ data: this._isData }));
	}
}

function getCommand(raw: string): string {
	if (!raw)
		return raw;
	let idx = raw.indexOf(" ");
	if (~idx)
		return raw.substr(0, idx).toLowerCase();
	return raw.toLowerCase();
}
