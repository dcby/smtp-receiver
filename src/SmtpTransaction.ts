export class SmtpTransaction {
	private _from: string;
	private _to: string[];

	constructor(from: string) {
		this._from = from;
		this._to = [];
	}

	get from() { return this._from; };
	get to() { return this._to; };
}
