import {
	types,
	runCliWithDefaultArgs,
	cliInfoFromPackageJson,
	namedArg,
	positionalArg,
	createCliWithDefaultArgs,
} from "@hediet/cli";
import { join } from "path";

interface CmdData {
	run(): Promise<void>;
}

const cli = createCliWithDefaultArgs<CmdData>()
	.addCmd({
		//name: "print",
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
				console.log("print:", args);
				for (const f of args.files) {
					if (args.onlyFileNames) {
						console.log(f);
					} else {
						console.log(f + " content");
					}
				}
			},
		}),
	})
	.addCmd({
		name: "echo",
		description: "Echos an input.",
		positionalArgs: [
			positionalArg("input", types.string, {
				description: "What to echo.",
			}),
			positionalArg("mode", types.choice("default", "special", "fast")),
		],
		getData: args => ({
			async run() {
				console.log("echo:", args.input, `(${args.mode})`);
			},
		}),
	});

runCliWithDefaultArgs({
	info: cliInfoFromPackageJson(join(__dirname, "../package.json")),
	cli,
	dataHandler: data => data.run(),
});
