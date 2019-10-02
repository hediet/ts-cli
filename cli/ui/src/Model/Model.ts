import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { ConsoleRpcLogger } from "@hediet/typed-json-rpc";
import { observable, action, computed, when } from "mobx";
import { uiContract } from "@hediet/cli/dist/src/uiContract";

export class Model {
	port: number;

	@observable.ref
	public server: typeof uiContract.TServerInterface | undefined = undefined;

	@observable private _loading = false;

	public get loading(): boolean {
		return this._loading;
	}

	constructor() {}

	async stayConnected(): Promise<void> {
		while (true) {
			try {
				const stream = await WebSocketStream.connectTo({
					host: "localhost",
					port: this.port,
				});
				const { server } = uiContract.getServerFromStream(
					stream,
					new ConsoleRpcLogger(),
					{}
				);
				this.server = server;

				await stream.onClosed;
			} catch (e) {}
		}
	}
}
