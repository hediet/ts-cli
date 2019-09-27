# Typed RPC Library based on JSON RPC

[![](https://img.shields.io/twitter/follow/hediet_dev.svg?style=social)](https://twitter.com/intent/follow?screen_name=hediet_dev)

A strongly typed remote procedure call library for typescript.

Is compatible with JSON RPC 2.0. However, only object arguments are supported at the moment.

# Install

To install the base library:

```
yarn add @hediet/typed-json-rpc
```

For websocket clients:

```
yarn add @hediet/typed-json-rpc-websocket
```

For websocket servers:

```
yarn add @hediet/typed-json-rpc-websocket-server
```

For webworker communication:

```
yarn add @hediet/typed-json-rpc-browser
```

For process stdio communication:

```
yarn add @hediet/typed-json-rpc-streams
```

# Features

-   Runtime checked types through `io-ts`
-   Supports Request/Response and Notification semantics
-   Supports Error and Success Responses
-   Provides a lot of abstractions (see Architecture)
-   Provides RPC over various mediums
    -   Websockets
    -   NodeJS Streams (Stdio)
    -   Webworker

# Usage

## Defining Contracts

It is recommended to use the contracts API to specify RPC interfaces.
Servers and clients are handled symmetrically.

```ts
import {
	types as t,
	contract,
	requestContract,
	notificationContract,
} from "@hediet/typed-json-rpc";

const myRpcContract = contract({
	// the interface for clients to interact with servers
	server: {
		calculate: requestContract({
			// io-ts is used to specify types.
			// This might change in future major versions.
			params: t.type({
				data: t.string,
			}),
			result: t.string,
		}),
	},
	// the interface for servers to interact with clients
	client: {
		progress: notificationContract({
			params: t.type({
				progress: t.number,
			}),
		}),
	},
});
```

## RPC over Websockets

Server:

```ts
import { startWebSocketServer } from "@hediet/typed-json-rpc-websocket-server";

const clients = new Set<typeof myRpcContract.TClientInterface>();
startWebSocketServer({ port: 12345 }, async stream => {
	// `stream` provides methods to send and receive messages
	const { client } = myRpcContract.registerServerToStream(
		stream,
		// You can specify a logger to make debugging easier.
		new ConsoleRpcLogger(),
		{
			calculate: async ({ data }) => {
				// call the client
				await client.progress({ progress: 0.5 });
				return { result: data };
			},
		}
	);
	clients.add(client);
	await stream.onClosed;
	clients.delete(client);
});
```

Client:

```ts
import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";

const { server } = myRpcContract.getServerFromStream(
	await WebSocketStream.connectTo({ address: "ws://localhost:12345" }),
	new ConsoleRpcLogger(),
	{
		progress: ({ progress }) => console.log("progress", progress),
	}
);
const result = await server.calculate({ data: "some data" });
```

## RPC over Standard Input/Output

Main process:

```ts
import { NodeJsMessageStream } from "@hediet/typed-json-rpc-streams";

const proc = spawn("node", [join(__dirname, "echo-process")]);
const stream = ;
const { server } = myRpcContract.getServerFromStream(
	NodeJsMessageStream.connectToProcess(proc),
	logger,
	{
		progress: ({ progress }) => console.log("progress", progress),
	}
);
const result = await server.calculate({ data: "some data" });
```

Child process:

```ts
import { NodeJsMessageStream } from "@hediet/typed-json-rpc-streams";

const { server } = myRpcContract.getServerFromStream(
	NodeJsMessageStream.connectToThisProcess(),
	logger,
	{
		calculate: async ({ data }) => {
			await client.progress({ progress: 0.5 });
			return { result: data };
		},
	}
);
```

## RPC over Web-Workers

Main window:

```ts
import {
	connectToWorker
} from "@hediet/typed-json-rpc-browser";

const worker = new Worker("./browser-worker.ts");
const stream = ;
const { server } = myRpcContract.getServerFromStream(
	connectToWorker(worker),
	logger,
	{
		progress: ({ progress }) => console.log("progress", progress),
	}
);
const result = await server.calculate({ data: "some data" });
```

Web-Worker:

```ts
import { workerConnectToParent } from "@hediet/typed-json-rpc-browser";

const { server } = myRpcContract.getServerFromStream(
	workerConnectToParent(),
	logger,
	{
		calculate: async ({ data }) => {
			await client.progress({ progress: 0.5 });
			return { result: data };
		},
	}
);
```

# Architecture of `@hediet/typed-json-rpc`

![classes](docs/exported/main/Main.png)

Extend `BaseMessageStream` if you want to implement custom message transport.

Implement `Channel` or `ChannelFactory` if you already provide a request/response channel.
