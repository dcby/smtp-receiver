import {Socket} from "net";
import * as crypto from "crypto";

let buf = new Buffer(8);

export function generateId(): string {
	buf.writeDoubleBE(new Date().valueOf(), 0);
	let sha1 = crypto.createHash("sha1");
	sha1.update(buf);
	return sha1.digest("hex");
}
