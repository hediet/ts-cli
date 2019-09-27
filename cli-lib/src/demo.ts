import { types } from "./param-types";
import { Cli } from "./cli";

const cli = new Cli<{
	run: () => Promise<void>;
}>({
	mainCmd: f =>
		f.cmd(
			{
				description: "test",
				positionalArgs: [
					f.positionalArg("test", types.string, {
						description: "The test",
					}),
				],
				namedArgs: {
					v: f.namedArg(types.booleanFlag, {
						description: "The foo",
					}),
				},
			},
			args => ({
				async run() {
					console.log("hi");
				},
			})
		),
});

const cmd = cli.parse(["foo", "-v"]);

cmd.run();
