import React, { Component } from "react";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";
import { HandPaper } from "@styled-icons/fa-solid/HandPaper";
type BoxColliderNodeEditorProps = {
  editor?: object;
  node?: object;
};
export default class BoxColliderNodeEditor extends Component<
  BoxColliderNodeEditorProps,
  {}
> {
  onChangeWalkable = walkable => {
    (this.props.editor as any).setPropertySelected("walkable", walkable);
  };
  render() {
    return (
      <NodeEditor
        {...this.props}
        /* @ts-ignore */
        description={BoxColliderNodeEditor.description}
      >
        { /* @ts-ignore */ }
        <InputGroup name="Walkable">
          <BooleanInput
            value={(this.props.node as any).walkable}
            onChange={this.onChangeWalkable}
          />
        </InputGroup>
      </NodeEditor>
    );
  }
}
