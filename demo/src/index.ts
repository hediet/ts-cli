import {
	Cli,
	types,
	runExtendedCli,
	cliInfoFromPackageJson,
	namedArg,
	positionalArg,
	ExtendedCli,
} from "@hediet/cli";
import { join } from "path";

interface CmdData {
	run(): Promise<void>;
}

const cli = new ExtendedCli<CmdData>()
	.addGlobalNamedArgs({ help: namedArg(types.booleanFlag, {}) })
	.addSubCmd({
		name: "print",
		description: "Prints selected files.",
		positionalArgs: [
			positionalArg("files", types.arrayOf(types.string), {
				description: "The files to print.",
			}),
		],
		namedArgs: {
			onlyFileNames: namedArg(types.booleanFlag, {
				shortName: "n",
				description: "Only print filenames",
			}),
			count: namedArg(types.int, {
				description: "The count",
			}),
		},
		getData: args => ({
			async run() {
				console.log("print:");
				for (const f of args.files) {
					if (args.onlyFileNames) {
						console.log(f);
					} else {
						console.log(f + " content");
					}
				}
			},
		}),
	});

runExtendedCli({
	info: cliInfoFromPackageJson(join(__dirname, "../package.json")),
	cli,
	dataHandler: data => data.run(),
});
