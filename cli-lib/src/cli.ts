import { CmdFactory } from "./cmd-builder";
import { Cmd } from "./cmd";

export type CmdDescription<TCommand> = (
	cmdFactory: CmdFactory<TCommand>
) => Cmd<TCommand>;

export type CliOptions<TCmdData> = {
	mainCmd?: CmdDescription<TCmdData>;
	subCmds?: Record<string, CmdDescription<TCmdData>>;
};

export class Cli<TCmdData> {
	constructor(private readonly options: CliOptions<TCmdData>) {}

	parse(argv: string[]): TCmdData;
}
