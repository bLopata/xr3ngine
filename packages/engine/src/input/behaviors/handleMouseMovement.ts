import { Behavior } from '../../common/interfaces/Behavior';
import { Entity } from '../../ecs/classes/Entity';
import { InputType } from '../enums/InputType';
import { Input } from '../components/Input';
import { getComponent } from '../../ecs/functions/EntityFunctions';
import { MouseInput } from '../enums/MouseInput';
import { LifecycleValue } from '../../common/enums/LifecycleValue';

/**
 * Local reference to input component
 */
const mousePosition: [number, number] = [0, 0];
const mouseMovement: [number, number] = [0, 0];

/**
 * System behavior called whenever the mouse pressed
 *
 * @param {Entity} entity The entity
 * @param args is argument object. Events that occur due to the user interacting with a pointing device (such as a mouse).
 */

export const handleMouseMovement: Behavior = (entity: Entity, args: { event: MouseEvent; }): void => {
  const input = getComponent(entity, Input);
  mousePosition[0] = (args.event.clientX / window.innerWidth) * 2 - 1;
  mousePosition[1] = (args.event.clientY / window.innerHeight) * -2 + 1;
  mouseMovement[0] = args.event.movementX;
  mouseMovement[1] = args.event.movementY;

  // If mouse position not set, set it with lifecycle started
  if (!input.data.has(input.schema.mouseInputMap.axes[MouseInput.MousePosition])) {
    input.data.set(input.schema.mouseInputMap.axes[MouseInput.MousePosition], {
      type: InputType.TWODIM,
      value: mousePosition,
      lifecycleState: LifecycleValue.STARTED
    });
    // Set movement delta
    input.data.set(input.schema.mouseInputMap.axes[MouseInput.MouseMovement], {
      type: InputType.TWODIM,
      value: mouseMovement
    });
  } else {
    // If mouse position set, check it's value
    const oldMousePosition = input.data.get(input.schema.mouseInputMap.axes[MouseInput.MousePosition])
    // If it's not the same, set it and update the lifecycle value to changed
    if (JSON.stringify(oldMousePosition) !== JSON.stringify(mousePosition)) {
      // Set type to TWODIM (two-dimensional axis) and value to a normalized -1, 1 on X and Y
      input.data.set(input.schema.mouseInputMap.axes[MouseInput.MousePosition], {
        type: InputType.TWODIM,
        value: mousePosition,
        lifecycleState: LifecycleValue.CONTINUED
      });
      // Set movement delta
      input.data.set(input.schema.mouseInputMap.axes[MouseInput.MouseMovement], {
        type: InputType.TWODIM,
        value: mouseMovement,
        lifecycleState: LifecycleValue.CONTINUED
      });
    } else {
      // Otherwise, remove it
      input.data.delete(input.schema.mouseInputMap.axes[MouseInput.MousePosition])
      input.data.delete(input.schema.mouseInputMap.axes[MouseInput.MouseMovement])
    }
  }
}
