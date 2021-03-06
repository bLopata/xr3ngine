import { CharacterComponent } from '../components/CharacterComponent';
import { getComponent } from '../../../ecs/functions/EntityFunctions';
import { addState } from '../../../state/behaviors/StateBehaviors';
import { CharacterStateTypes } from '../CharacterStateTypes';
import { Entity } from '../../../ecs/classes/Entity';
import { getSignedAngleBetweenVectors } from '../../../common/functions/getSignedAngleBetweenVectors';
import { getCameraRelativeMovementVector } from '../functions/getCameraRelativeMovementVector';


export const setAppropriateStartWalkState = (entity: Entity): void => {
  const character = getComponent<CharacterComponent>(entity, CharacterComponent as any);

  let range = Math.PI;
  let angle = getSignedAngleBetweenVectors(character.orientation, getCameraRelativeMovementVector(entity));

  if (angle > range * 0.8) {
    addState(entity, { state: CharacterStateTypes.WALK_START_BACK_LEFT });
  }
  else if (angle < -range * 0.8) {
    addState(entity, { state: CharacterStateTypes.WALK_START_BACK_RIGHT });
  }
  else if (angle > range * 0.3) {
    addState(entity, { state: CharacterStateTypes.WALK_START_LEFT });
  }
  else if (angle < -range * 0.3) {
    addState(entity, { state: CharacterStateTypes.WALK_START_RIGHT });
  }
  else {
    addState(entity, { state: CharacterStateTypes.WALK_START_FORWARD });
  }
};
