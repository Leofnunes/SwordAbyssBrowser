
/*:
 * @target MZ
 * @plugindesc Scales and displays battleback images fully on screen with 16:9 support
 * @author Leandro Nunes
 * @url www.1337games.com.br
 * 
 * @param scaleMode
 * @text Scale Mode
 * @type select
 * @option Auto 16:9 (detects and scales 16:9 images)
 * @value auto16-9
 * @option Fit (maintain aspect ratio)
 * @value fit
 * @option Fill (stretch to screen)
 * @value fill
 * @default auto16-9
 * @desc How to scale the battleback images
 * 
 * @param centerImages
 * @text Center Images
 * @type boolean
 * @default true
 * @desc Center the battleback images on screen
 * 
 * @param aspectRatioTolerance
 * @text Aspect Ratio Tolerance
 * @type number
 * @decimals 3
 * @min 0.001
 * @max 0.1
 * @default 0.01
 * @desc Tolerance for detecting 16:9 ratio (default: 0.01)
 * 
 * @help
 * This plugin scales battleback images to display fully on the battle screen.
 * Automatically detects and handles 16:9 aspect ratio images.
 * 
 * Scale Modes:
 * - Auto 16:9: Automatically detects 16:9 images and scales them perfectly
 *              to fit the screen. Falls back to Fit mode for other ratios.
 * - Fit: Scales the image to fit within the screen while maintaining aspect ratio
 * - Fill: Stretches the image to fill the entire screen
 * 
 * Common 16:9 Resolutions:
 * 1920x1080, 1280x720, 1147x648, 854x480, 640x360, etc.
 * 
 * Place this plugin in your plugins folder and enable it in the Plugin Manager.
 */

(() => {
    const pluginName = "FullBattlebackDisplay";
    const parameters = PluginManager.parameters(pluginName);
    const scaleMode = parameters['scaleMode'] || 'auto16-9';
    const centerImages = parameters['centerImages'] === 'true';
    const aspectTolerance = parseFloat(parameters['aspectRatioTolerance']) || 0.01;
    const ASPECT_16_9 = 16 / 9;
    function is16by9(width, height) {
        if (width <= 0 || height <= 0) return false;
        const aspectRatio = width / height;
        return Math.abs(aspectRatio - ASPECT_16_9) < aspectTolerance;
    }
    const _Spriteset_Battle_update = Spriteset_Battle.prototype.update;
    Spriteset_Battle.prototype.update = function() {
        _Spriteset_Battle_update.call(this);
        this.updateBattlebackScale();
    };
    Spriteset_Battle.prototype.updateBattlebackScale = function() {
        if (!this._battlebacksScaled) {
            this.scaleBattlebacks();
        }
    };
    Spriteset_Battle.prototype.scaleBattlebacks = function() {
        const battlebacks = [this._back1Sprite, this._back2Sprite];
        const screenWidth = Graphics.width;
        const screenHeight = Graphics.height;
        const screenAspect = screenWidth / screenHeight;
        let allLoaded = true;

        for (const sprite of battlebacks) {
            if (sprite && sprite.bitmap) {
                if (!sprite.bitmap.isReady()) {
                    allLoaded = false;
                    continue;
                }

                const imgWidth = sprite.bitmap.width;
                const imgHeight = sprite.bitmap.height;

                if (imgWidth > 0 && imgHeight > 0 && !sprite._battlebackScaled) {
                    let scale;

                    if (scaleMode === 'auto16-9' && is16by9(imgWidth, imgHeight)) {
                        if (screenAspect > ASPECT_16_9) {
                            scale = screenHeight / imgHeight;
                        } else {
                            scale = screenWidth / imgWidth;
                        }
                        sprite.scale.x = scale;
                        sprite.scale.y = scale;

                    } else if (scaleMode === 'fill') {
                        sprite.scale.x = screenWidth / imgWidth;
                        sprite.scale.y = screenHeight / imgHeight;

                    } else {
                        const scaleX = screenWidth / imgWidth;
                        const scaleY = screenHeight / imgHeight;
                        scale = Math.min(scaleX, scaleY);
                        sprite.scale.x = scale;
                        sprite.scale.y = scale;
                    }

                    if (centerImages) {
                        sprite.x = (screenWidth - imgWidth * sprite.scale.x) / 2;
                        sprite.y = (screenHeight - imgHeight * sprite.scale.y) / 2;
                    } else {
                        sprite.x = 0;
                        sprite.y = 0;
                    }

                    sprite._battlebackScaled = true;
                }
            }
        }

        if (allLoaded) {
            this._battlebacksScaled = true;
        }
    };
    Spriteset_Battle.prototype.locateBattleback = function() {
    };
    const _Spriteset_Battle_createBattleback = Spriteset_Battle.prototype.createBattleback;
    Spriteset_Battle.prototype.createBattleback = function() {
        this._battlebacksScaled = false;
        _Spriteset_Battle_createBattleback.call(this);
    };

})();


