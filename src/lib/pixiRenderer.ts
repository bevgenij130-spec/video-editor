import { Application, Container } from "pixi.js";

/**
 * Pixi.js renderer bootstrap for the timeline — skeleton only.
 * The actual clip/track rendering layers will be built on top of this.
 */
export interface PixiRendererHandle {
  app: Application;
  root: Container;
  destroy: () => void;
}

let handle: PixiRendererHandle | null = null;

export async function initPixiRenderer(
  host: HTMLElement,
): Promise<PixiRendererHandle> {
  if (handle) return handle;

  const app = new Application();
  await app.init({
    background: 0x0d0d10,
    resizeTo: host,
    antialias: false,
  });
  host.appendChild(app.canvas);

  const root = new Container();
  app.stage.addChild(root);

  handle = {
    app,
    root,
    destroy: () => {
      app.destroy(true, { children: true });
      handle = null;
    },
  };
  return handle;
}
