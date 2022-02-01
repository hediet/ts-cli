import {
	CliDefaultGlobalArgs,
	Cli,
	cliToSchema,
	sSchema,
} from "@hediet/cli-lib";
import { printCmdHelp } from "./help/printCmdHelp";
import { printCliHelp } from "./help/printCliHelp";
import { showGui } from "./showGui";
import { CliInfo } from "./cli-info";

export interface RunDefaultCliOptions<TCmdData> {
	/**
	 * The cli to process.
	 */
	cli: Cli<TCmdData, CliDefaultGlobalArgs>;
	/**
	 * General app info for help and version commands.
	 * Use `cliInfoFromPackageJson` to read info from your `package.json`.
	 */
	info: CliInfo;
	/**
	 * Asynchronously process the data returned by the `getData` of the selected command.
	 */
	dataHandler: (data: TCmdData) => Promise<void>;
	/**
	 * The arguments to parse. Use `process.argv.slice(2)` by default.
	 */
	args?: string[];
}

/**
 * Processes command line arguments and invokes the handler
 * with data obtained from `getData` of the selected command.
 * Also processes `--help`, `--version` and other global flags.
 */
export function runDefaultCli<TCmdData>(
	options: RunDefaultCliOptions<TCmdData>
) {
	const cmdArgs = options.args || process.argv.slice(2);
	const result = options.cli.parse(cmdArgs);

	function showHelp() {
		console.log();
		if (!result.parsedArgs["help"] && result.errors) {
			for (const e of result.errors.errors) {
				console.error(e.message);
			}

			console.log();
		}
		if (result.selectedCmd) {
			printCmdHelp(
				{
					commandName: options.info.commandName,
					appName: options.info.appName,
				},
				result.selectedCmd
			);
			if (
				result.selectedCmd.name === undefined &&
				options.cli.cmds.length > 1
			) {
				console.log();
				console.log("----------------------");
				console.log();
				printCliHelp(options.cli, options.info, true);
			}
		} else {
			printCliHelp(options.cli, options.info);
		}
		console.log();
		if (result.errors.hasErrors) {
			process.exit(1);
		}
	}

	function run(data: TCmdData) {
		options.dataHandler(data).catch(e => {
			// todo
			console.error(e);
			process.exit(1);
		});
	}

	let verbose = false;

	if (result.parsedArgs["cli::verbose"]) {
		verbose = true;
	}

	if (result.parsedArgs["help"]) {
		showHelp();
		return;
	} else if (result.parsedArgs["version"]) {
		console.log(`version: ${options.info.version}`);
		return;
	} else if (result.parsedArgs["cli::gui"]) {
		showGui(options.cli, run, result.selectedCmd, verbose);
		return;
	} else if (result.parsedArgs["cli::schema"]) {
		const schema = cliToSchema(options.cli);
		const json = sSchema.serialize(schema);
		console.log(JSON.stringify(json, undefined, 4));
		return;
	} else if (result.parsedArgs["cli::json-args"] !== undefined) {
		const jsonStr = result.parsedArgs["cli::json-args"];
		const json = JSON.parse(jsonStr);
		const cmd = options.cli
			.getSerializer()
			.deserializeTyped(json)
			.unwrap();
		const data = cmd.getData();
		run(data);
		return;
	} else if (result.errors.hasErrors) {
		showHelp();
		return;
	}

	if (!result.dataFactory) {
		throw new Error("Error");
	}

	const data = result.dataFactory();
	run(data);
}
