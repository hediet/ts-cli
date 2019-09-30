import { ExtendedCli } from "@hediet/cli-lib";
import { printCmdHelp } from "./printCmdHelp";
import { printCliHelp } from "./printCliHelp";

export function runExtendedCli<TData>(options: {
	cli: ExtendedCli<TData>;
	dataHandler: (data: TData) => Promise<void>;
	args?: string[];
}) {
	const cmdArgs = options.args || process.argv.slice(2);
	const result = options.cli.parse(cmdArgs);
	if ("errors" in result) {
		throw new Error(result.errors.toString());
	}
	const data = result.data;
	if ("isExtendedCmd" in data) {
		switch (data.kind) {
			case "versionCmd":
				console.log("show version");
				return;
			case "guiCmd":
				console.log("show gui");
				return;
			case "helpCmd":
				if (data.errors) {
					for (const e of data.errors.errors) {
						console.error(e.message);
					}
				}
				console.log();
				if (data.cmd) {
					printCmdHelp(
						{ cmdName: data.cmdName, appName: "app" },
						data.cmd
					);
				} else {
					printCliHelp(options.cli);
				}

				return;
			case "schemaCmd":
				console.log("show schema");
				return;
		}
	} else {
		options.dataHandler(data);
	}
}
