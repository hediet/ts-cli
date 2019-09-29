import { CmdParser, CmdAssembler } from "../src";
import { join } from "path";
import { deepEqual } from "assert";
import { Cli } from "../src/cli";
import { types } from "../src/param-types";

describe("CommandLineParser", () => {
	it("should parse", () => {
		const p = new CmdParser();
		const parsed = p.parseArgs([
			"watch",
			"--silent",
			"test.txt",
			"-v",
			"-aC",
			"-l",
			"test.log",
			"--bla=1",
		]);

		const a = new CmdAssembler({
			namedArgs: {
				silent: { kind: "NoValue" },
				v: { kind: "NoValue", shortName: "v" },
				a: { kind: "NoValue", shortName: "a" },
				C: { kind: "NoValue", shortName: "C" },
				l: { kind: "SingleValue", shortName: "l" },
				bla: { kind: "SingleValue" },
			},
		});

		const assembled = a.process(parsed);
	});

	it("parse", () => {
		const cli = new Cli<Record<string, unknown>>({
			mainCmd: f =>
				f.cmd(
					{
						description: "test",
						positionalArgs: [
							f.positionalArg(
								"mode",
								types.choice("test", "bla"),
								{
									description: "The test",
								}
							),
						],
						namedArgs: {
							verbose: f.namedArg(types.booleanFlag, {
								description: "The foo",
								shortName: "v",
							}),
						},
					},
					args => args
				),
			subCmds: {
				watch: f =>
					f.cmd(
						{
							description: "watches files",
							positionalArgs: [
								f.positionalArg("files", types.string, {
									description: "the files to watch",
								}),
							],
						},
						args => args
					),
			},
		});

		const cmd = cli.parse(["watcah", "uiae"]);
		console.log(cmd);
	});
});
