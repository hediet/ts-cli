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

	it("parse", () => {});
});
