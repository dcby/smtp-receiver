import * as net from "net";
import * as lib from "./lib";
import * as t from "./types";
import {SmtpSession} from "./SmtpSession";

export default class Receiver {
	private _config: any;
	private _mware: t.Middleware[] = [];

	constructor(config?: { ip?: string, port?: number }) {
		this._config = Object.assign({ ip: "0.0.0.0", port: 25 }, config || {});
	}

	use(middleware: t.Middleware) {
		this._mware.push(middleware);
	}

	run() {
		let server = net.createServer(this.handleConnection.bind(this));
		server.listen(this._config.port, this._config.ip,
			() => console.log(`listen on ${server.localAddress}:${server.localPort}`));
	}

	private async handleConnection(sock: net.Socket) {
		sock.on("error", _ => { }); // guard
		let id = lib.generateId().substr(0, 8);
		console.log(`[${id}] ${sock.remoteAddress}:${sock.remotePort} client connect`);
		sock.on("close", isErr => console.log(`[${id}] client disconnect${isErr ? " with error" : ""}`));

		let session = new SmtpSession({ id: id, sock: sock, nextBuilder: this.nextBuilder.bind(this) });
		try {
			await session.process();
		}
		catch (err) {
			console.warn(`[${id}] ${err.stack}`);
		}
		if (sock.writable)
			sock.end();

		sock.unref();
	}

	private nextBuilder(context: t.IContext, input: t.IInput, reply: t.IReply): t.NextFunc {
		let idx = 0;
		let mware = this._mware;

		return function next(): Promise<void> {
            let func = mware[idx++];
            if (func)
                return func.call(context, input, reply, next);
        }
	}
}
