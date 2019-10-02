import React = require("react");
import { Model } from "../Model/Model";
import { observer } from "mobx-react";
import { observable, computed } from "mobx";
import { Popover, Button, Spinner } from "@blueprintjs/core";
import classnames = require("classnames");

@observer
export class GUI extends React.Component<{ model: Model }> {
	render() {
		const m = this.props.model;
		return <div className="component-GUI">uiae</div>;
	}
}
