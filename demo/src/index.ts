import {
	ExtendedCli,
	types,
	runExtendedCli,
	cliInfoFromPackageJson,
} from "@hediet/cli";
import { join } from "path";

interface CmdData {
	run(): Promise<void>;
}

const cli = new ExtendedCli<CmdData>({
	sharedNamedArgs: f => ({ foo: f.namedArg(types.string, {}) }),
	subCmds: {
		print: f =>
			f.cmd(
				{
					description: "prints files",
					positionalArgs: [
						f.positionalArg("files", types.arrayOf(types.string), {
							description: "the files to print",
						}),
					],
					namedArgs: {
						onlyFileNames: f.namedArg(types.booleanFlag, {
							shortName: "n",
							description: "Only print filenames",
						}),
						count: f.namedArg(types.int, {
							description: "The count",
						}),
					},
				},
				args => ({
					async run() {
						console.log("print:");
						//args.
						for (const f of args.files) {
							if (args.onlyFileNames) {
								console.log(f);
							} else {
								console.log(f + " content");
							}
						}
					},
				})
			),
	},
});

runExtendedCli({
	info: cliInfoFromPackageJson(join(__dirname, "../package.json")),
	cli,
	dataHandler: data => data.run(),
});

const cli2 = new ExtendedCli2<CmdData>()
	.addGlobalNamedArg("version", types.string, {})
	.addCmd({
		name: "print",
		description: "Prints selected files.",
		positionalArgs: {
			foo: {
				name: "files",
				type: types.arrayOf(types.string),
				description: "The files to print.",
			},
		},
	})
	.addCmd({
		name: "print",
		description: "Prints selected files.",
		positionalArgs: {
			foo: {
				name: "files",
				type: types.arrayOf(types.string),
				description: "The files to print.",
			},
		},
	});
