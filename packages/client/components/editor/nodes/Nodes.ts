import Editor from "../Editor";

import SceneNode from "./SceneNode";
import SceneNodeEditor from "../ui/properties/SceneNodeEditor";
import GroupNode from "./GroupNode";
import GroupNodeEditor from "../ui/properties/GroupNodeEditor";
import ModelNode from "./ModelNode";
import ModelNodeEditor from "../ui/properties/ModelNodeEditor";
import GroundPlaneNode from "./GroundPlaneNode";
import GroundPlaneNodeEditor from "../ui/properties/GroundPlaneNodeEditor";
import BoxColliderNode from "./BoxColliderNode";
import BoxColliderNodeEditor from "../ui/properties/BoxColliderNodeEditor";
import AmbientLightNode from "./AmbientLightNode";
import AmbientLightNodeEditor from "../ui/properties/AmbientLightNodeEditor";
import DirectionalLightNode from "./DirectionalLightNode";
import DirectionalLightNodeEditor from "../ui/properties/DirectionalLightNodeEditor";
import SpotLightNode from "./SpotLightNode";
import SpotLightNodeEditor from "../ui/properties/SpotLightNodeEditor";
import PointLightNode from "./PointLightNode";
import PointLightNodeEditor from "../ui/properties/PointLightNodeEditor";
import HemisphereLightNode from "./HemisphereLightNode";
import HemisphereLightNodeEditor from "../ui/properties/HemisphereLightNodeEditor";
import SpawnPointNode from "./SpawnPointNode";
import SpawnPointNodeEditor from "../ui/properties/SpawnPointNodeEditor";
import WayPointNode from "./WayPointNode";
import WayPointNodeEditor from "../ui/properties/WayPointNodeEditor";
import SkyboxNode from "./SkyboxNode";
import SkyboxNodeEditor from "../ui/properties/SkyboxNodeEditor";
import FloorPlanNode from "./FloorPlanNode";
import FloorPlanNodeEditor from "../ui/properties/FloorPlanNodeEditor";
import ImageNode from "./ImageNode";
import ImageNodeEditor from "../ui/properties/ImageNodeEditor";
import VideoNode from "./VideoNode";
import VideoNodeEditor from "../ui/properties/VideoNodeEditor";
import SpawnerNode from "./SpawnerNode";
import SpawnerNodeEditor from "../ui/properties/SpawnerNodeEditor";
import TriggerVolumeNode from "./TriggerVolumeNode";
import TriggerVolumeNodeEditor from "../ui/properties/TriggerVolumeNodeEditor";
import LinkNode from "./LinkNode";
import LinkNodeEditor from "../ui/properties/LinkNodeEditor";
import ParticleEmitterNode from "./ParticleEmitterNode";
import ParticleEmitterNodeEditor from "../ui/properties/ParticleEmitterNodeEditor";
import KitPieceNode from "./KitPieceNode";
import KitPieceNodeEditor from "../ui/properties/KitPieceNodeEditor";
import SimpleWaterNode from "./SimpleWaterNode";
import SimpleWaterNodeEditor from "../ui/properties/SimpleWaterNodeEditor";
import AudioNode from "./AudioNode";
import AudioNodeEditor from "../ui/properties/AudioNodeEditor";
import ScenePreviewCameraNode from "./ScenePreviewCameraNode";
import ScenePreviewCameraNodeEditor from "../ui/properties/ScenePreviewCameraNodeEditor";

import SketchfabSource from "../ui/assets/sources/SketchfabSource";
import PolySource from "../ui/assets/sources/PolySource";
import BingImagesSource from "../ui/assets/sources/BingImagesSource";
import BingVideosSource from "../ui/assets/sources/BingVideosSource";
import TenorSource from "../ui/assets/sources/TenorSource";
import ElementsSource from "../ui/assets/sources/ElementsSource";
import MyAssetsSource from "../ui/assets/sources/MyAssetsSource";
import ArchitectureKitSource from "../ui/assets/sources/ArchitectureKitSource";
import RockKitSource from "../ui/assets/sources/RockKitSource";
import HubsSoundPackSource from "../ui/assets/sources/HubsSoundPackSource";

export function createEditor(api, settings) {
  const editor = new Editor(api, settings);

  editor.registerNode(SceneNode, SceneNodeEditor);
  editor.registerNode(GroupNode, GroupNodeEditor);
  editor.registerNode(ModelNode, ModelNodeEditor);
  editor.registerNode(GroundPlaneNode, GroundPlaneNodeEditor);
  editor.registerNode(BoxColliderNode, BoxColliderNodeEditor);
  editor.registerNode(AmbientLightNode, AmbientLightNodeEditor);
  editor.registerNode(DirectionalLightNode, DirectionalLightNodeEditor);
  editor.registerNode(HemisphereLightNode, HemisphereLightNodeEditor);
  editor.registerNode(SpotLightNode, SpotLightNodeEditor);
  editor.registerNode(PointLightNode, PointLightNodeEditor);
  editor.registerNode(SpawnPointNode, SpawnPointNodeEditor);
  editor.registerNode(WayPointNode, WayPointNodeEditor);
  editor.registerNode(SkyboxNode, SkyboxNodeEditor);
  editor.registerNode(FloorPlanNode, FloorPlanNodeEditor);
  editor.registerNode(ImageNode, ImageNodeEditor);
  editor.registerNode(VideoNode, VideoNodeEditor);
  editor.registerNode(AudioNode, AudioNodeEditor);
  editor.registerNode(SpawnerNode, SpawnerNodeEditor);
  editor.registerNode(TriggerVolumeNode, TriggerVolumeNodeEditor);
  editor.registerNode(LinkNode, LinkNodeEditor);
  editor.registerNode(ParticleEmitterNode, ParticleEmitterNodeEditor);
  editor.registerNode(KitPieceNode, KitPieceNodeEditor);
  editor.registerNode(SimpleWaterNode, SimpleWaterNodeEditor);
  editor.registerNode(ScenePreviewCameraNode, ScenePreviewCameraNodeEditor);

  editor.registerSource(new ElementsSource(editor));
  editor.registerSource(new MyAssetsSource(editor));
  editor.registerSource(new ArchitectureKitSource(api));
  editor.registerSource(new RockKitSource(api));
  editor.registerSource(new SketchfabSource(api));
  editor.registerSource(new PolySource(api));
  editor.registerSource(new BingImagesSource(api));
  editor.registerSource(new BingVideosSource(api));
  editor.registerSource(new HubsSoundPackSource(editor));
  editor.registerSource(new TenorSource(api));

  return editor;
}
