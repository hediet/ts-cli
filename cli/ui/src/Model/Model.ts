import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { ConsoleRpcLogger } from "@hediet/typed-json-rpc";
import { observable, action, computed, when, autorun } from "mobx";
import { uiContract } from "@hediet/cli/dist/src/uiContract";
import { sSchema } from "@hediet/cli-lib";
import {
	TypeSystem,
	Type,
	ObjectType,
	ObjectProperty,
} from "@hediet/semantic-json";
import { NodeContainer, createDefaultNode } from "@hediet/semantic-json-react";

const urlParams = new URLSearchParams(window.location.search);
const wsPortParam = urlParams.get("wsPort");

export class Model {
	port: number = parseInt(wsPortParam!, 10);

	@observable.ref
	public server: typeof uiContract.TServerInterface | undefined = undefined;

	@observable.ref
	public cmdType: Type | undefined = undefined;

	@observable.ref
	public defaultCmdType: Type | undefined = undefined;

	@computed
	public get val(): NodeContainer | undefined {
		if (!this.cmdType) {
			return undefined;
		}

		const c = new NodeContainer(this.cmdType);
		c.node = createDefaultNode(c.expectedType);
		if (c.node.kind !== "object") {
			throw "";
		}
		if (this.defaultCmdType) {
			c.node.properties["cmd"].container.node = createDefaultNode(
				this.defaultCmdType
			);
		}
		return c;
	}

	constructor() {
		autorun(() => {
			const c = this.val;
			if (c && c.node) {
				console.log(c.node.toJson());
			}
		});

		autorun(async () => {
			if (this.server) {
				const rawSchema = await this.server.getSchema();
				const ts = new TypeSystem();
				const schema = sSchema.deserialize(rawSchema).unwrap();

				for (const p of schema.typePackages) {
					p.addToTypeSystem(ts);
				}

				this.defaultCmdType =
					schema.defaultType && ts.getType(schema.defaultType);

				this.cmdType = new ObjectType({
					cmd: new ObjectProperty(
						"cmd",
						ts.getType(schema.mainType)!,
						false,
						undefined
					),
				});

				console.log(this.cmdType);
			}
		});

		this.stayConnected();
	}

	@action.bound
	public run() {
		const data = (this.val!.node!.toJson() as any)["cmd"];
		console.log(data);
		this.server!.run({
			args: data,
		});
	}

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
				this.server = undefined;
			} catch (e) {}

			//window.close();
		}
	}
}
