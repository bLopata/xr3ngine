import { Behavior } from '../../../common/interfaces/Behavior';
import { Entity } from '../../../ecs/classes/Entity';
import { getMutableComponent } from '../../../ecs/functions/EntityFunctions';
import { CharacterComponent } from '../components/CharacterComponent';
import { TransformComponent } from '../../../transform/components/TransformComponent';
import { rotateModel } from "./rotateModel";
import { springRotation } from "./springRotation";
import { springMovement } from "./springMovement";
import { Object3DComponent } from '../../../common/components/Object3DComponent';
import { cannonFromThreeVector } from "../../../common/functions/cannonFromThreeVector";
import { Vector3 } from 'three';
import { Engine } from '../../../ecs/classes/Engine';

export const updateCharacter: Behavior = (entity: Entity, args = null, deltaTime) => {
  const actor = getMutableComponent<CharacterComponent>(entity, CharacterComponent as any);
  const actorTransform = getMutableComponent<TransformComponent>(entity, TransformComponent as any);
  if(!actor.initialized) return
  // actor.behaviour?.update(timeStep);
  // actor.vehicleEntryInstance?.update(timeStep);
  // console.log(this.occupyingSeat);
  // this.charState?.update(timeStep);
  actor.mixer.update(deltaTime);
  if (actor.physicsEnabled) {
    springMovement(entity, null, deltaTime);
    springRotation(entity, null, deltaTime);
    rotateModel(entity);
    actorTransform.position.set(
      actor.actorCapsule.body.position.x,
      actor.actorCapsule.body.position.y,
      actor.actorCapsule.body.position.z
    );

    // actorTransform.position.set(
    //   actor.actorCapsule.body.interpolatedPosition.x,
    //   actor.actorCapsule.body.interpolatedPosition.y,
    //   actor.actorCapsule.body.interpolatedPosition.z
    // );
  }
  else {
    let newPos = new Vector3();
    getMutableComponent(entity, Object3DComponent).value.getWorldPosition(newPos);
    actor.actorCapsule.body.position.copy(cannonFromThreeVector(newPos));
    actor.actorCapsule.body.interpolatedPosition.copy(cannonFromThreeVector(newPos));
  }

  actor.viewVector = new Vector3().subVectors(actorTransform.position, Engine.camera.position);
  
};
