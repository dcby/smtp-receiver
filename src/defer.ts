export interface IDefer {
	resolve: (value: any) => void,
	reject: (err: Error) => void,
	promise: Promise<any>,
	pending: boolean,
	settled: boolean,
	fulfilled: boolean,
	rejected: boolean
}

export function defer(): IDefer {
	let resolveFunc, rejectFunc;
	let promise = new Promise((res, rej) => {
        resolveFunc = res;
        rejectFunc = rej;
    });

	let ret = {
		resolve: resolve,
		reject: reject,
		promise: promise,
		pending: true,
		settled: false,
		fulfilled: false,
		rejected: false
	};

	function resolve(value: any) {
		resolveFunc(value);
		ret.pending = false;
		ret.settled = ret.fulfilled = true;
	}

	function reject(err: Error) {
		rejectFunc(err);
		ret.pending = false;
		ret.settled = ret.rejected = true;
	}

	return ret;
}
