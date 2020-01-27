import { startWebSocketServer } from "@hediet/typed-json-rpc-websocket-server";
import { Cli, cliToSchema, sSchema, Cmd } from "@hediet/cli-lib";
import { uiContract } from "./uiContract";
import chromeLauncher = require("chrome-launcher");
import * as http from "http";
import { Disposable } from "@hediet/std/disposable";
import finalhandler = require("finalhandler");
import serveStatic = require("serve-static");
import { join } from "path";
import { AddressInfo } from "net";

export async function showGui<TCmd>(
	cli: Cli<TCmd>,
	run: (cmd: TCmd) => void,
	selectedCmd: Cmd<TCmd> | undefined
) {
	let chrome: Disposable | undefined;

	const { httpServerDisposable, httpServerPort } = startHttpServer();

	const server = startWebSocketServer({ port: 0 }, async stream => {
		uiContract.registerServerToStream(stream, undefined, {
			getSchema: async () => {
				const schema = cliToSchema(cli);
				schema.defaultType = selectedCmd
					? selectedCmd.getSerializer().namespacedName
					: undefined;
				const json = sSchema.serialize(schema);
				return json as any;
			},
			run: async args => {
				const s = cli.getSerializer();
				const o = s.deserialize(args.args).unwrap();
				const data = o.getData();
				run(data);

				server.close();
			},
		});
		await stream.onClosed;

		server.dispose();
		httpServerDisposable.dispose();
		if (chrome) {
			chrome.dispose();
		}
	});

	await server.onListening;
	const websocketPort = server.port;

	try {
		const url = `http://localhost:${httpServerPort}/?wsPort=${websocketPort}`;
		try {
			chrome = await launchChrome(url);
		} catch (e) {
			console.log(e);
		}
		console.log(url);
	} catch (error) {}
}

function startHttpServer(): {
	httpServerDisposable: Disposable;
	httpServerPort: number;
} {
	const root = join(__dirname, "../../ui/dist");
	const serve = serveStatic(root, {
		index: ["index.html"],
	});
	const httpServer = http.createServer(function onRequest(req, res) {
		serve(req as any, res as any, finalhandler(req, res));
	});
	httpServer.listen();
	const httpServerPort = (httpServer.address() as AddressInfo).port;

	return {
		httpServerDisposable: {
			dispose: () => {
				httpServer.close();
			},
		},
		httpServerPort,
	};
}

async function launchChrome(url: string): Promise<Disposable> {
	const width = 700;
	const height = 500;

	const chrome = await chromeLauncher.launch({
		startingUrl: url,
		chromeFlags: ["--app=" + url, `--window-size=${width},${height}`],
	});

	return {
		dispose: () => {
			if (!chrome.process.killed) {
				try {
					chrome.process.kill();
				} catch (e) {
					// chrome should exit on its own when connection closes anyways
				}
			}
		},
	};
}
