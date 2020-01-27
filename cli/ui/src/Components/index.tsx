import React = require("react");
import { Model } from "../Model/Model";
import { observer } from "mobx-react";
import classnames = require("classnames");
import {
	ComposableEditorFactory,
	defaultFactories,
	createDefaultNode,
} from "@hediet/semantic-json-react";
import { Button } from "@blueprintjs/core";

@observer
export class GUI extends React.Component<{ model: Model }> {
	render() {
		const m = this.props.model;
		const container = m.val;
		if (!container) {
			return <div />;
		}

		const f = new ComposableEditorFactory(defaultFactories);
		const editor = f.getBestEditor(container.node!, f)!;

		return (
			<div className="component-GUI">
				{editor.render()}
				<div className="part-button">
					<Button
						intent={"primary"}
						disabled={!m.server}
						style={{ width: 100 }}
						text={"Run"}
						onClick={m.run}
					/>
				</div>
			</div>
		);
	}
}
