import * as net from "net";
import * as lib from "./lib";
import * as t from "./types";
import * as mod from "./";
import {SmtpSession} from "./SmtpSession";
import {default as defaultMware} from "./middleware/default";

export default class Receiver {
	private _config: any;
	private _mware: t.Middleware[] = [];
	private _log: mod.Log;

	constructor(config?: { ip?: string, port?: number }) {
		this._log = new mod.Log("recv");
		this._config = Object.assign({ ip: "0.0.0.0", port: 25 }, config || {});
	}

	use(middleware: t.Middleware) {
		this._mware.push(middleware);
	}

	run() {
		let server = net.createServer(this.handleConnection.bind(this));
		server.listen(this._config.port, this._config.ip, () => {
			let addr = server.address();
			this._log.info(`listen on ${addr.address}:${addr.port}`)
		});
	}

	private async handleConnection(sock: net.Socket) {
		sock.on("error", _ => { }); // guard
		let id = lib.generateId().substr(0, 8);
		this._log.info(`[${id}] ${sock.remoteAddress}:${sock.remotePort} client connect`);
		sock.on("close", isErr => this._log.info(`[${id}] client disconnect${isErr ? " with error" : ""}`));

		let session = new SmtpSession({ id: id, sock: sock, nextBuilder: this.nextBuilder.bind(this) });
		try {
			await session.process();
		}
		catch (err) {
			this._log.warn(`[${id}] ${err.stack}`);
		}
		if (sock.writable)
			sock.end();

		sock.unref();
	}

	private nextBuilder(context: t.IContext, input: t.IInput, reply: t.IReply): t.NextFunc {
		let idx = 0;
		let mware = this._mware.length ? this._mware : [defaultMware];

		return function next(): Promise<void> {
            let func = mware[idx++];
            if (func)
                return func.call(context, input, reply, next);
        }
	}

	private log(prefix: string, message: any, level?: string) { }
}
