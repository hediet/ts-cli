import {
	types,
	runDefaultCli,
	cliInfoFromPackageJson,
	namedParam,
	positionalParam,
	createDefaultCli,
} from "@hediet/cli";
import { join } from "path";

const cli = createDefaultCli()
	.addCmd({
		name: "print",
		description: "Prints selected files.",
		positionalParams: [
			positionalParam("files", types.arrayOf(types.string), {
				description: "The files to print.",
			}),
		],
		namedParams: {
			onlyFileNames: namedParam(types.booleanFlag, {
				shortName: "n",
				description: "Only print filenames",
			}),
			count: namedParam(types.int, {
				description: "The count",
			}),
		},
		getData: (args) => async () => {
			console.log("print:", args);
			for (const f of args.files) {
				if (args.onlyFileNames) {
					console.log(f);
				} else {
					console.log(f + " content");
				}
			}
		},
	})
	.addCmd({
		name: "echo",
		description: "Echos an input.",
		namedParams: {
			a: namedParam(types.booleanFlag, {
				shortName: "a",
			}),
			b: namedParam(types.booleanFlag, {
				shortName: "b",
			}),
			c: namedParam(types.string, {
				shortName: "c",
			}),
		},
		positionalParams: [
			positionalParam("input", types.string, {
				description: "What to echo.",
			}),
			positionalParam("mode", types.choice("default", "special", "fast")),
		],
		getData: (args) => async () => {
			console.log("echo:", args.input, `(${args.mode})`);
		},
	});

runDefaultCli({
	info: cliInfoFromPackageJson(join(__dirname, "../package.json")),
	cli,
	dataHandler: (data) => data(),
});
