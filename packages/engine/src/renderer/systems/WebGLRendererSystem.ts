import { NearestFilter, PerspectiveCamera, RGBFormat, WebGLRenderer, WebGLRenderTarget } from 'three';
import { Behavior } from '../../common/interfaces/Behavior';
import { Engine } from '../../ecs/classes/Engine';
import { Entity } from '../../ecs/classes/Entity';
import { System, SystemAttributes } from '../../ecs/classes/System';
import {
  addComponent,
  createEntity,
  getComponent,
  getMutableComponent,
  hasComponent
} from '../../ecs/functions/EntityFunctions';
import { RendererComponent } from '../components/RendererComponent';
import { EffectComposer } from '../../postprocessing/core/EffectComposer';
import { RenderPass } from '../../postprocessing/passes/RenderPass';
import { CameraComponent } from '../../camera/components/CameraComponent';
import { SSAOEffect } from '../../postprocessing/effects/SSAOEffect';
import { DepthOfFieldEffect } from '../../postprocessing/effects/DepthOfFieldEffect';
import { EffectPass } from '../../postprocessing/passes/EffectPass';
import { DepthDownsamplingPass } from '../../postprocessing/passes/DepthDownsamplingPass';
import { NormalPass } from '../../postprocessing/passes/NormalPass';
import { BlendFunction } from '../../postprocessing/effects/blending/BlendFunction';
import { TextureEffect } from '../../postprocessing/effects/TextureEffect';
  /**
   * Handles rendering and post processing to WebGL canvas
   */
export class WebGLRendererSystem extends System {
    isInitialized: boolean
  constructor(attributes?: SystemAttributes) {
    super(attributes);

    this.onResize = this.onResize.bind(this);

    // Create the Renderer singleton
    addComponent(createEntity(), RendererComponent);
    const renderer = new WebGLRenderer({
      antialias: true
    });
    Engine.renderer = renderer;
    // Add the renderer to the body of the HTML document
    document.body.appendChild(Engine.renderer.domElement);
    window.addEventListener('resize', this.onResize, false);
    this.onResize()

    this.isInitialized = true
  }

  /**
     * Called on resize, sets resize flag
     */
  onResize() {
    RendererComponent.instance.needsResize = true;
  }

  /**
    * Removes resize listener
    */
  dispose() {
    super.dispose()

    const rendererComponent = RendererComponent.instance
    rendererComponent?.composer?.dispose()

    window.removeEventListener('resize', this.onResize);
    document.body.removeChild(Engine.renderer.domElement);
    this.isInitialized = false
  }

  /**
    * Configure post processing
    * Note: Post processing effects are set in the PostProcessingSchema provided to the system
    * @param {Entity} entity - The Entity
    */
  private configurePostProcessing(entity: Entity) {
    const rendererComponent = getMutableComponent<RendererComponent>(entity, RendererComponent);
    const composer = new EffectComposer(Engine.renderer);
    rendererComponent.composer = composer;
    const renderPass = new RenderPass(Engine.scene, Engine.camera);
    renderPass.scene = Engine.scene;
    renderPass.camera = Engine.camera;
    composer.addPass(renderPass);
    // This sets up the render
    const passes: any[] = []
    const normalPass = new NormalPass(renderPass.scene, renderPass.camera, { renderTarget: new WebGLRenderTarget(1, 1, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format: RGBFormat,
      stencilBuffer: false
    }) });
    const depthDownsamplingPass = new DepthDownsamplingPass({
      normalBuffer: normalPass.texture,
      resolutionScale: 0.5
    });
    const normalDepthBuffer =	depthDownsamplingPass.texture;

    RendererComponent.instance.postProcessingSchema.effects.forEach((pass: any) => {
      if ( pass.effect === SSAOEffect){
        passes.push(new pass.effect(Engine.camera, normalPass.texture, {...pass.options, normalDepthBuffer }))
      }
      else if ( pass.effect === DepthOfFieldEffect)
        passes.push(new pass.effect(Engine.camera, pass.options))
      else passes.push(new pass.effect(pass.options))
    })
    const textureEffect = new TextureEffect({
			blendFunction: BlendFunction.SKIP,
			texture: depthDownsamplingPass.texture
		});
    if (passes.length) {
      composer.addPass(depthDownsamplingPass);
      composer.addPass(new EffectPass(Engine.camera, ...passes, textureEffect))
    }
  }

  /**
     * Called each frame by default from the Engine
     *
     * @param {Number} delta time since last frame
     */
  execute (delta: number) {
    this.queryResults.renderers.added?.forEach((entity: Entity) => {
      RendererComponent.instance.needsResize = true;
      this.configurePostProcessing(entity);
    });

    if(this.isInitialized)
      this.queryResults.renderers.all.forEach((entity: Entity) => {
        if (!hasComponent(entity, RendererComponent)) {
          return
        }
        resize(entity)
        getComponent<RendererComponent>(entity, RendererComponent).composer.render(delta);
      });

    this.queryResults.renderers.removed.forEach((entity: Entity) => {
      // cleanup
    })
  }
}

/**
 * Resize the canvas
 */
export const resize: Behavior = entity => {
  const rendererComponent = getComponent<RendererComponent>(entity, RendererComponent);

  if (rendererComponent.needsResize) {
    const canvas = Engine.renderer.domElement;
    const curPixelRatio = Engine.renderer.getPixelRatio();

    if (curPixelRatio !== window.devicePixelRatio) Engine.renderer.setPixelRatio(window.devicePixelRatio);

    const width = window.innerWidth;
    const height = window.innerHeight;

    if ((Engine.camera as PerspectiveCamera).isPerspectiveCamera) {
      const cam = Engine.camera as PerspectiveCamera;
      cam.aspect = width / height;
      cam.updateProjectionMatrix();
    }

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    Engine.renderer.setSize(width, height);
    rendererComponent.composer ? rendererComponent.composer.setSize(width, height):'';

    RendererComponent.instance.needsResize = false;
  }
};

WebGLRendererSystem.queries = {
  renderers: {
    components: [RendererComponent],
    listen: {
      added: true,
      removed: true
    }
  }
};
