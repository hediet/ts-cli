import { ExtendedData, Cli, cliToSchema } from "@hediet/cli-lib";
import { printCmdHelp } from "./printCmdHelp";
import { printCliHelp } from "./printCliHelp";

export interface CliInfo {
	appName: string;
	version: string;
}

export function runExtendedCli<TCmdData>(options: {
	cli: Cli<ExtendedData<TCmdData>, any>;
	info: CliInfo;
	dataHandler: (data: TCmdData) => Promise<void>;
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
				console.log(`version: ${options.info.version}`);
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
						{
							cmdName: data.cmd.name,
							appName: options.info.appName,
						},
						data.cmd
					);
				} else {
					printCliHelp(options.cli, options.info);
				}

				return;
			case "schemaCmd":
				console.log(
					JSON.stringify(cliToSchema(options.cli), undefined, 4)
				);
				return;
		}
	} else {
		options.dataHandler(data);
	}
}
