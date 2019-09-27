import { CmdParser, CmdAssembler } from "../src";
import { join } from "path";
import { deepEqual } from "assert";

describe("CommandLineParser", () => {
	it("should parse", async () => {
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
				silent: { mode: "NoValue" },
				v: { mode: "NoValue", shortName: "v" },
				a: { mode: "NoValue", shortName: "a" },
				C: { mode: "NoValue", shortName: "C" },
				l: { mode: "SingleValue", shortName: "l" },
				bla: { mode: "SingleValue" },
			},
		});

		const assembled = a.process(parsed);
	});
});
