/*:
 * @target MZ
 * @plugindesc Pixel art nítida (Nearest Neighbor) sem imagem borrada de filtragem.
 * @author Leandro Nunes
 * @url www.1337games.com.br
 * @help
 * Coloque este plugin no topo da lista, simples assim.
 */

(() => {
  "use strict";

  function applyNearest() {
    if (window.PIXI && PIXI.SCALE_MODES) {
      if (PIXI.settings) PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
      if (PIXI.BaseTexture && PIXI.BaseTexture.defaultOptions) {
        PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
      }
      if (PIXI.utils && PIXI.utils.TextureCache) {
        const cache = PIXI.utils.TextureCache;
        for (const key in cache) {
          const tex = cache[key];
          if (tex && tex.baseTexture) tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        }
      }
    }
  }

  const _SceneManager_initGraphics = SceneManager.initGraphics;
  SceneManager.initGraphics = function() {
    _SceneManager_initGraphics.call(this);
    applyNearest();
  };
  applyNearest();
})();


