import { ExtendedCli, types, runExtendedCli } from "@hediet/cli";

interface CmdData {
	run(): Promise<void>;
}

const cli = new ExtendedCli<CmdData>({
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

runExtendedCli({ cli, dataHandler: data => data.run() });
