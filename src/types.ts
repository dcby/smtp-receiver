import {Socket} from "net";
import {SmtpTransaction} from "./SmtpTransaction";

export interface IContext {
	id: string,
	sock: Socket,
	tran?: SmtpTransaction,
	done?: boolean
}

export interface IInput {
	connect?: boolean,
	command?: ICommand,
	data?: IData
}

export interface ICommand {
	name: string,
	raw: string,
	overflow?: boolean
}

export interface IData {
	data: Buffer,
	eod: boolean
}

export interface IReply {
	code: number,
	text?: string
}

export type Middleware = (input: IInput, reply: IReply, next: () => Promise<void>) => Promise<void>;
export type NextFunc = () => Promise<void>;
export type NextBuilderFunc = (context: IContext, input: IInput, reply: IReply) => NextFunc;
