import React, { Component } from "react";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import ColorInput from "../inputs/ColorInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import LightShadowProperties from "./LightShadowProperties";
import { Lightbulb } from "@styled-icons/fa-solid/Lightbulb";
type PointLightNodeEditorProps = {
  editor?: object,
  node?: object
};
export default class PointLightNodeEditor extends Component<
  PointLightNodeEditorProps,
  {}
> {
  onChangeColor = color => {
    this.props.editor.setPropertySelected("color", color);
  };
  onChangeIntensity = intensity => {
    this.props.editor.setPropertySelected("intensity", intensity);
  };
  onChangeRange = range => {
    this.props.editor.setPropertySelected("range", range);
  };
  render() {
    const { node, editor } = this.props as any;
    return (
      <NodeEditor
        {...this.props}
        description={PointLightNodeEditor.description}
      >
        <InputGroup name="Color">
          <ColorInput value={node.color} onChange={this.onChangeColor} />
        </InputGroup>
        <NumericInputGroup
          name="Intensity"
          min={0}
          smallStep={0.001}
          mediumStep={0.01}
          largeStep={0.1}
          value={node.intensity}
          onChange={this.onChangeIntensity}
          unit="cd"
        />
        <NumericInputGroup
          name="Range"
          min={0}
          smallStep={0.1}
          mediumStep={1}
          largeStep={10}
          value={node.range}
          onChange={this.onChangeRange}
          unit="m"
        />
        <LightShadowProperties node={node} editor={editor} />
      </NodeEditor>
    );
  }
}