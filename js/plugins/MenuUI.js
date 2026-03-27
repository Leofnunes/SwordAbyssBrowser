
/*:
 * @target MZ
 * @plugindesc Modern menu layout optimized for 1152x648 (16:9) with large gauges
 * @author Leandro Nunes
 * @url www.1337games.com.br
 * @help
 * 
 * This plugin redesigns the main menu with:
 * - Optimized layout for 1152x648 resolution
 * - Large, easy-to-read HP/MP gauges
 * - Clean, organized design
 * - Modern visual styling
 * 
 * No plugin commands needed - just install and play!
 */

(() => {

    const _Sprite_Gauge_bitmapWidth = Sprite_Gauge.prototype.bitmapWidth;
    Sprite_Gauge.prototype.bitmapWidth = function() {
        if (SceneManager._scene instanceof Scene_Menu) {
            return 350;
        }
        return _Sprite_Gauge_bitmapWidth.call(this);
    };

    const _Sprite_Gauge_bitmapHeight = Sprite_Gauge.prototype.bitmapHeight;
    Sprite_Gauge.prototype.bitmapHeight = function() {
        if (SceneManager._scene instanceof Scene_Menu) {
            return 36;
        }
        return _Sprite_Gauge_bitmapHeight.call(this);
    };

    const _Sprite_Gauge_gaugeHeight = Sprite_Gauge.prototype.gaugeHeight;
    Sprite_Gauge.prototype.gaugeHeight = function() {
        if (SceneManager._scene instanceof Scene_Menu) {
            return 24;
        }
        return _Sprite_Gauge_gaugeHeight.call(this);
    };

    Scene_Menu.prototype.commandWindowRect = function() {
        const ww = 280;
        const wh = Graphics.boxHeight - this.calcWindowHeight(1, true);
        const wx = 0;
        const wy = 0;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Menu.prototype.goldWindowRect = function() {
        const ww = Graphics.boxWidth - 280;
        const wh = this.calcWindowHeight(1, true);
        const wx = 280;
        const wy = Graphics.boxHeight - wh;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Menu.prototype.statusWindowRect = function() {
        const ww = Graphics.boxWidth - 280;
        const wh = Graphics.boxHeight - this.calcWindowHeight(1, true);
        const wx = 280;
        const wy = 0;
        return new Rectangle(wx, wy, ww, wh);
    };

    Window_MenuCommand.prototype.maxCols = function() {
        return 1;
    };

    Window_MenuCommand.prototype.itemHeight = function() {
        return 72;
    };

    const _Window_MenuCommand_drawItem = Window_MenuCommand.prototype.drawItem;
    Window_MenuCommand.prototype.drawItem = function(index) {
        const rect = this.itemLineRect(index);
        const align = this.itemTextAlign();
        this.resetTextColor();
        this.changePaintOpacity(this.isCommandEnabled(index));
        const iconY = rect.y + (rect.height - ImageManager.iconHeight) / 2;
        const textY = rect.y + (rect.height - this.lineHeight()) / 2;

        this.drawIcon(this.commandIcon(index), rect.x + 12, iconY);
        this.drawText(this.commandName(index), rect.x + 56, textY, rect.width - 64, align);
    };

    Window_MenuCommand.prototype.commandIcon = function(index) {
        const symbol = this.commandSymbol(index);
        const symbols = {
            'item': 176,
            'skill': 79,
            'equip': 137,
            'status': 84,
            'formation': 82,
            'Bestiary': 187,
            'options': 83,
            'save': 225,
            'gameEnd': 1,
            'quest': 189
        };
        return symbols[symbol] || 0;
    };

    Window_MenuStatus.prototype.maxCols = function() {
        return 1;
    };

    Window_MenuStatus.prototype.numVisibleRows = function() {
        return 4;
    };

    Window_MenuStatus.prototype.itemHeight = function() {
        return Math.floor(this.innerHeight / 4);
    };

    Window_MenuStatus.prototype.drawItem = function(index) {
        this.drawItemBackground(index);
        this.drawActorInfo(index);
    };

    Window_MenuStatus.prototype.drawItemBackground = function(index) {
        const rect = this.itemRect(index);
        if (index === this.index()) {
            this.drawBackgroundRect(rect);
        }
    };

    Window_MenuStatus.prototype.drawBackgroundRect = function(rect) {
        const c1 = ColorManager.itemBackColor1();
        const c2 = ColorManager.itemBackColor2();
        const x = rect.x;
        const y = rect.y;
        const w = rect.width;
        const h = rect.height;
        this.contentsBack.gradientFillRect(x, y, w, h, c1, c2);
        this.contentsBack.strokeRect(x, y, w, h, c1);
    };

    Window_MenuStatus.prototype.drawActorInfo = function(index) {
        const actor = this.actor(index);
        const rect = this.itemRect(index);
        const padding = 8;
        const x = rect.x + padding;
        const y = rect.y + padding;
        const availableHeight = rect.height - (padding * 2);
        const faceSize = 120;
        const bitmap = ImageManager.loadFace(actor.faceName());
        const fw = ImageManager.faceWidth;
        const fh = ImageManager.faceHeight;
        const sx = (actor.faceIndex() % 4) * fw;
        const sy = Math.floor(actor.faceIndex() / 4) * fh;
        this.contents.blt(bitmap, sx, sy, fw, fh, x, y, faceSize, faceSize);
        const textX = x + faceSize + 16;
        const textWidth = rect.width - faceSize - padding * 3;
        this.contents.fontSize = 22;
        this.drawText(actor.name(), textX, y, textWidth);
        this.resetFontSettings();
        this.contents.fontSize = 18;
        const levelClassY = y + 28;
        this.drawText("Lv." + actor.level, textX, levelClassY, 80);
        this.drawText(actor.currentClass().name, textX + 90, levelClassY, textWidth - 90);
        this.resetFontSettings();
        const gaugeY = y + 52;
        this.placeGauge(actor, "hp", textX, gaugeY);
        this.placeGauge(actor, "mp", textX, gaugeY + 36);
        if (availableHeight > 100) {
            const iconsY = gaugeY + 74;
            this.drawActorIcons(actor, textX, iconsY, textWidth);
        }
    };

    ColorManager.itemBackColor1 = function() {
        return "rgba(0, 0, 0, 0.2)";
    };

    ColorManager.itemBackColor2 = function() {
        return "rgba(0, 0, 0, 0.4)";
    };

})();


