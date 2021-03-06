import { Behavior } from '../../common/interfaces/Behavior';
import { Entity } from '../../ecs/classes/Entity';
import { getComponent } from '../../ecs/functions/EntityFunctions';
import { CameraComponent } from '../components/CameraComponent';
/**
 * Apply setting to camera
 * 
 * @param {Entity} entity - The Entity
 */
export const applySettingsToCamera: Behavior = (entity: Entity): void => {
  const cameraComponent = getComponent(entity, CameraComponent) as CameraComponent;
  cameraComponent.camera.fov = cameraComponent.fov;
  cameraComponent.camera.aspect = cameraComponent.aspect;
  cameraComponent.camera.near = cameraComponent.near;
  cameraComponent.camera.far = cameraComponent.far;
  cameraComponent.camera.layers = cameraComponent.layers;
  cameraComponent.camera.handleResize = cameraComponent.handleResize;
};
