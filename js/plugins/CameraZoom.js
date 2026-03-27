
/*:
 * @target MZ
 * @plugindesc Zoom da câmera
 * @author Leandro Nunes
 * @url www.1337games.com.br
 *
 * @param zoomScale
 * @text Fator de Zoom
 * @desc Nível de zoom. 1.0 = normal | 2.0 = dobro de aproximação | 0.5 = afastado
 * @type number
 * @decimals 2
 * @min 0.10
 * @max 3.00
 * @default 1.20
 *
 * @command setZoom
 * @text Alterar Zoom
 * @desc Muda o zoom da câmera em tempo real via Comando de Plugin.
 *
 * @arg scale
 * @text Fator de Zoom
 * @type number
 * @decimals 2
 * @min 0.10
 * @max 3.00
 * @default 1.20
 *
 */

(() => {
    "use strict";

    const pluginName = "CameraZoom";
    const parameters = PluginManager.parameters(pluginName);

    let _currentZoomScale = Math.max(0.10, parseFloat(parameters["zoomScale"] || 1.2));

    const _DataManager_makeSaveContents = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function () {
        const contents = _DataManager_makeSaveContents.call(this);
        contents.cameraZoomScale = _currentZoomScale;
        return contents;
    };

    const _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function (contents) {
        _DataManager_extractSaveContents.call(this, contents);
        if (contents.cameraZoomScale !== undefined) {
            _currentZoomScale = contents.cameraZoomScale;
        }
    };

    const _Game_Map_screenTileX = Game_Map.prototype.screenTileX;
    Game_Map.prototype.screenTileX = function () {
        return _Game_Map_screenTileX.call(this) / _currentZoomScale;
    };

    const _Game_Map_screenTileY = Game_Map.prototype.screenTileY;
    Game_Map.prototype.screenTileY = function () {
        return _Game_Map_screenTileY.call(this) / _currentZoomScale;
    };

    const _Spriteset_Map_updatePosition = Spriteset_Map.prototype.updatePosition;
    Spriteset_Map.prototype.updatePosition = function () {
        _Spriteset_Map_updatePosition.call(this);
        this.scale.x = _currentZoomScale;
        this.scale.y = _currentZoomScale;
    };
    const _Spriteset_Map_initialize = Spriteset_Map.prototype.initialize;
    Spriteset_Map.prototype.initialize = function () {
        _Spriteset_Map_initialize.call(this);
        this.scale.x = _currentZoomScale;
        this.scale.y = _currentZoomScale;
    };

    const _Game_Player_center = Game_Player.prototype.center;
    Game_Player.prototype.center = function (x, y) {
        _Game_Player_center.call(this, x, y);
        $gameMap.setDisplayPos(
            x - $gameMap.screenTileX() / 2,
            y - $gameMap.screenTileY() / 2
        );
    };

    PluginManager.registerCommand(pluginName, "setZoom", (args) => {
        _currentZoomScale = Math.max(0.10, parseFloat(args.scale || 1.0));
        if ($gamePlayer && $gameMap) {
            $gamePlayer.center($gamePlayer.x, $gamePlayer.y);
        }
    });

})();


