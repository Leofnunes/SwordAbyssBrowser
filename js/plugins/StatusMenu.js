
/*:
 * @target MZ
 * @plugindesc Modern, visually stunning status menu with animated elements
 * @author Leandro Nunes
 * @url www.1337games.com.br
 *
 * @help Elite Status Menu v1.0.0
 * 
 * This plugin replaces the default status menu with a modern,
 * elegant design featuring:
 * - Animated gradient backgrounds
 * - Smooth parameter bars with glow effects
 * - Dynamic stat displays
 * - Equipment showcase with icons
 * - Professional character portrait display
 * 
 * No plugin commands needed - just activate and enjoy!
 * 
 * @param useGlowEffects
 * @text Usar Efeitos de Brilho
 * @type boolean
 * @default true
 * @desc Ativa efeitos de brilho nas barras de HP/MP
 * 
 * @param primaryColor
 * @text Cor Primária de Destaque
 * @type string
 * @default #6366f1
 * @desc Cor principal dos elementos da interface (formato hex)
 * 
 * @param secondaryColor
 * @text Cor Secundária de Destaque
 * @type string
 * @default #8b5cf6
 * @desc Cor secundária para gradientes (formato hex)
 */

(() => {
    const pluginName = "EliteStatusMenu";
    const parameters = PluginManager.parameters(pluginName);
    const useGlowEffects = parameters['useGlowEffects'] === 'true';
    const primaryColor = parameters['primaryColor'] || '#6366f1';
    const secondaryColor = parameters['secondaryColor'] || '#8b5cf6';

    const _Scene_Status_create = Scene_Status.prototype.create;
    Scene_Status.prototype.create = function() {
        _Scene_Status_create.call(this);
        this._animationTimer = 0;
        if (this._profileWindow) {
            this.removeChild(this._profileWindow);
        }
    };

    const _Scene_Status_start = Scene_Status.prototype.start;
    Scene_Status.prototype.start = function() {
        _Scene_Status_start.call(this);
        if (this._statusParamsWindow) {
            this._statusParamsWindow.visible = false;
            this._statusParamsWindow.deactivate();
        }
        if (this._statusEquipWindow) {
            this._statusEquipWindow.visible = false;
            this._statusEquipWindow.deactivate();
        }
    };

    Scene_Status.prototype.profileWindowRect = function() {
        const wx = 0;
        const wy = 0;
        const ww = Graphics.boxWidth;
        const wh = 0;
        return new Rectangle(wx, wy, ww, wh);
    };

    const _Scene_Status_statusWindowRect = Scene_Status.prototype.statusWindowRect;
    Scene_Status.prototype.statusWindowRect = function() {
        const rect = _Scene_Status_statusWindowRect.call(this);
        rect.height = Graphics.boxHeight - rect.y;
        return rect;
    };

    const _Scene_Status_update = Scene_Status.prototype.update;
    Scene_Status.prototype.update = function() {
        _Scene_Status_update.call(this);
        this._animationTimer++;
        if (this._statusWindow) {
            this._statusWindow.refresh();
        }
    };

    Window_Status.prototype.refresh = function() {
        Window_StatusBase.prototype.refresh.call(this);
        if (this._actor) {
            this.drawEliteStatus();
        }
    };

    Window_Status.prototype.drawEliteStatus = function() {
        const actor = this._actor;
        const width = this.innerWidth;
        const height = this.innerHeight;
        this.contents.clear();
        this.drawAnimatedBackground(width, height);
        const panelWidth = 480;
        const gap = 40;
        const totalWidth = panelWidth * 2 + gap;
        const offsetX = (width - totalWidth) / 2;
        this.drawCharacterSection(actor, offsetX, 10);
        this.drawParametersSection(actor, offsetX + panelWidth + gap, 10);
        this.drawStatesSection(actor, offsetX + panelWidth + gap, 330);
        this.drawEquipmentSection(actor, offsetX, 330);
    };

    Window_Status.prototype.drawAnimatedBackground = function(width, height) {
        const ctx = this.contents.context;
        const time = Graphics.frameCount * 0.01;
        const gradient1 = ctx.createLinearGradient(0, 0, width / 2, height);
        gradient1.addColorStop(0, this.hexToRgba(primaryColor, 0.05));
        gradient1.addColorStop(1, this.hexToRgba(secondaryColor, 0.1));

        ctx.fillStyle = gradient1;
        ctx.fillRect(0, 0, width / 2 - 10, height);

        const gradient2 = ctx.createLinearGradient(width / 2, 0, width, height);
        gradient2.addColorStop(0, this.hexToRgba(secondaryColor, 0.05));
        gradient2.addColorStop(1, this.hexToRgba(primaryColor, 0.1));

        ctx.fillStyle = gradient2;
        ctx.fillRect(width / 2 + 10, 0, width / 2 - 10, height);
    };

    Window_Status.prototype.drawCharacterSection = function(actor, x, y) {
        const width = 480;
        const height = 300;
        this.drawSectionPanel(x, y, width, height, "CHARACTER");
        const charName = actor.characterName();
        const charIndex = actor.characterIndex();
        const bitmap = ImageManager.loadCharacter(charName);
        const big = ImageManager.isBigCharacter(charName);
        const pw = bitmap.width / (big ? 3 : 12);
        const ph = bitmap.height / (big ? 4 : 8);
        const n = big ? 0 : charIndex;
        const sx = ((n % 4) * 3 + 1) * pw;
        const sy = (Math.floor(n / 4) * 4) * ph;

        this.contents.blt(bitmap, sx, sy, pw, ph, x + 60, y + 60, pw * 2, ph * 2);
        this.contents.fontSize = 28;
        this.contents.fontBold = true;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(actor.name(), x + 210, y + 60, 250, 'left');

        this.contents.fontSize = 20;
        this.changeTextColor(ColorManager.normalColor());
        this.drawText('Lv. ' + actor.level, x + 210, y + 92, 250, 'left');
        this.contents.fontSize = 20;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(actor.currentClass().name, x + 210, y + 118, 250, 'left');
        if (actor.isMaxLevel()) {
            this.contents.fontSize = 14;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText('MAX LEVEL', x + 25, y + 160, width - 50, 'center');
        } else {
            const currentExp = actor.currentExp();
            const nextLevelExp = actor.nextLevelExp();
            const expForLevel = nextLevelExp - currentExp;
            this.contents.fontSize = 14;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText('Experiência para subir de nível', x + 140, y + 160, width - 50, 'left');
            const expRate = (currentExp - actor.expForLevel(actor.level)) /
                           (actor.expForLevel(actor.level + 1) - actor.expForLevel(actor.level));
            this.drawExpGauge(x + 25, y + 185, width - 50, expRate);
        }
        this.drawEnhancedGauge(x + 25, y + 225, width - 50, actor.hp, actor.mhp, ColorManager.hpGaugeColor1(), ColorManager.hpGaugeColor2(), 'HP');
        this.drawEnhancedGauge(x + 25, y + 265, width - 50, actor.mp, actor.mmp, ColorManager.mpGaugeColor1(), ColorManager.mpGaugeColor2(), 'MP');

        this.contents.fontSize = $gameSystem.mainFontSize();
        this.contents.fontBold = false;
    };

    Window_Status.prototype.drawParametersSection = function(actor, x, y) {
        const width = 480;
        const height = 300;

        this.drawSectionPanel(x, y, width, height, "PARAMETERS");

        const params = [2, 3, 4, 5, 6, 7];
        const paramY = y + 55;
        const lineHeight = 36;

        for (let i = 0; i < params.length; i++) {
            const paramId = params[i];
            const py = paramY + i * lineHeight;
            this.contents.fontSize = 18;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(TextManager.param(paramId), x + 25, py, 100, 'left');
            const value = actor.param(paramId);
            const maxValue = 999;
            const barWidth = 240;
            const barX = x + 135;
            this.drawParamBar(barX, py + 5, barWidth, 18, value, maxValue, i);
            this.contents.fontSize = 20;
            this.contents.fontBold = true;
            this.changeTextColor(ColorManager.normalColor());
            this.drawText(value, barX + barWidth + 10, py - 1, 70, 'left');
            this.contents.fontBold = false;
        }

        this.contents.fontSize = $gameSystem.mainFontSize();
    };

    Window_Status.prototype.drawEquipmentSection = function(actor, x, y) {
        const width = 480;
        const height = 230;

        this.drawSectionPanel(x, y, width, height, "EQUIPMENT");

        const equips = actor.equips();
        const slotNames = $dataSystem.equipTypes;
        const lineHeight = 32;

        for (let i = 0; i < equips.length && i < 5; i++) {
            const ey = y + 50 + i * lineHeight;
            const equip = equips[i];
            this.contents.fontSize = 15;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(slotNames[i + 1], x + 20, ey, 120, 'left');
            if (equip) {
                this.drawItemName(equip, x + 140, ey, width - 160);
            } else {
                this.contents.fontSize = 15;
                this.changeTextColor(ColorManager.deathColor());
                this.drawText("- Empty -", x + 140, ey, width - 160, 'left');
            }
        }

        this.contents.fontSize = $gameSystem.mainFontSize();
    };

    Window_Status.prototype.drawStatesSection = function(actor, x, y) {
        const width = 480;
        const height = 230;

        this.drawSectionPanel(x, y, width, height, "Efeitos de Status");

        const states = actor.states();
        const contentY = y + 50;

        if (states.length === 0) {
            this.contents.fontSize = 18;
            this.changeTextColor(ColorManager.systemColor());
            const message = "Sem efeitos de Status";
            const textWidth = this.contents.measureTextWidth(message);
            this.drawText(message, x + (width - textWidth) / 50, contentY + 50, width, 'center');
        } else {
            const iconsPerRow = 12;
            const iconSize = 32;
            const iconSpacing = 38;
            const startX = x + 30;
            let currentX = startX;
            let currentY = contentY;
            let iconsInRow = 0;

            for (let i = 0; i < states.length; i++) {
                const state = states[i];
                this.drawIcon(state.iconIndex, currentX, currentY);

                iconsInRow++;
                currentX += iconSpacing;
                if (iconsInRow >= iconsPerRow) {
                    iconsInRow = 0;
                    currentX = startX;
                    currentY += iconSpacing + 4;
                }
            }
            const namesStartY = currentY + (iconsInRow > 0 ? iconSpacing + 6 : 6);
            this.contents.fontSize = 14;

            for (let i = 0; i < Math.min(states.length, 3); i++) {
                const state = states[i];
                const nameY = namesStartY + i * 22;
                this.drawIcon(state.iconIndex, startX, nameY - 2);
                this.changeTextColor(ColorManager.normalColor());
                this.drawText(state.name, startX + 38, nameY, width - 70, 'left');
            }
            if (states.length > 3) {
                const moreY = namesStartY + 3 * 22;
                this.contents.fontSize = 12;
                this.changeTextColor(ColorManager.systemColor());
                this.drawText(`...and ${states.length - 3} more`, startX, moreY, width - 60, 'left');
            }
        }

        this.contents.fontSize = $gameSystem.mainFontSize();
    };

    Window_Status.prototype.drawSectionPanel = function(x, y, width, height, title) {
        const ctx = this.contents.context;
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');

        ctx.fillStyle = gradient;
        this.drawRoundedRect(ctx, x, y, width, height, 8);
        ctx.strokeStyle = this.hexToRgba(primaryColor, 0.5);
        ctx.lineWidth = 2;
        this.strokeRoundedRect(ctx, x, y, width, height, 8);
        const titleGradient = ctx.createLinearGradient(x, y, x + width, y);
        titleGradient.addColorStop(0, this.hexToRgba(primaryColor, 0.8));
        titleGradient.addColorStop(1, this.hexToRgba(secondaryColor, 0.8));

        ctx.fillStyle = titleGradient;
        this.drawRoundedRect(ctx, x, y, width, 35, 8, true);
        this.contents.fontSize = 22;
        this.contents.fontBold = true;
        this.changeTextColor('#ffffff');
        this.drawText(title, x, y + 0, width, 'center');
        this.contents.fontBold = false;
        this.contents.fontSize = $gameSystem.mainFontSize();
    };

    Window_Status.prototype.drawEnhancedGauge = function(x, y, width, value, maxValue, color1, color2, label) {
        const ctx = this.contents.context;
        const rate = maxValue > 0 ? value / maxValue : 0;
        const height = 24;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.drawRoundedRect(ctx, x, y, width, height, 4);
        if (rate > 0) {
            const fillWidth = Math.floor(width * rate);
            const gradient = ctx.createLinearGradient(x, y, x + fillWidth, y);
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);

            ctx.fillStyle = gradient;
            this.drawRoundedRect(ctx, x, y, fillWidth, height, 4);
            if (useGlowEffects) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = color2;
                this.drawRoundedRect(ctx, x, y, fillWidth, height, 4);
                ctx.shadowBlur = 0;
            }
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        this.strokeRoundedRect(ctx, x, y, width, height, 4);
        this.contents.fontSize = 14;
        this.contents.fontBold = true;
        this.changeTextColor('#ffffff');
        this.drawText(label, x + 8, y + 4, 40, 'left');

        this.contents.fontSize = 16;
        const valueText = value + ' / ' + maxValue;
        this.drawText(valueText, x, y + 3, width - 10, 'right');

        this.contents.fontBold = false;
        this.contents.fontSize = $gameSystem.mainFontSize();
    };

    Window_Status.prototype.drawExpGauge = function(x, y, width, rate) {
        const ctx = this.contents.context;
        const height = 20;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.drawRoundedRect(ctx, x, y, width, height, 4);
        if (rate > 0) {
            const fillWidth = Math.floor(width * rate);
            const gradient = ctx.createLinearGradient(x, y, x + fillWidth, y);
            gradient.addColorStop(0, '#fbbf24');
            gradient.addColorStop(1, '#f59e0b');

            ctx.fillStyle = gradient;
            this.drawRoundedRect(ctx, x, y, fillWidth, height, 4);
            if (useGlowEffects) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#f59e0b';
                this.drawRoundedRect(ctx, x, y, fillWidth, height, 4);
                ctx.shadowBlur = 0;
            }
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        this.strokeRoundedRect(ctx, x, y, width, height, 4);
        this.contents.fontSize = 14;
        this.contents.fontBold = true;
        this.changeTextColor('#ffffff');
        const percentage = Math.floor(rate * 100) + '%';
        this.drawText(percentage, x, y + 2, width, 'center');

        this.contents.fontBold = false;
        this.contents.fontSize = $gameSystem.mainFontSize();
    };

    Window_Status.prototype.drawParamBar = function(x, y, width, height, value, maxValue, index) {
        const ctx = this.contents.context;
        const rate = Math.min(value / maxValue, 1);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.drawRoundedRect(ctx, x, y, width, height, 3);
        if (rate > 0) {
            const fillWidth = Math.floor(width * rate);
            const hue = (index * 60) % 360;
            const color1 = `hsl(${hue}, 70%, 50%)`;
            const color2 = `hsl(${hue}, 70%, 65%)`;

            const gradient = ctx.createLinearGradient(x, y, x + fillWidth, y);
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);

            ctx.fillStyle = gradient;
            this.drawRoundedRect(ctx, x, y, fillWidth, height, 3);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        this.strokeRoundedRect(ctx, x, y, width, height, 3);
    };

    Window_Status.prototype.drawRoundedRect = function(ctx, x, y, width, height, radius, topOnly = false) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);

        if (topOnly) {
            ctx.lineTo(x + width, y + height);
            ctx.lineTo(x, y + height);
        } else {
            ctx.lineTo(x + width, y + height - radius);
            ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
            ctx.lineTo(x + radius, y + height);
            ctx.arcTo(x, y + height, x, y + height - radius, radius);
        }

        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
        ctx.fill();
    };

    Window_Status.prototype.strokeRoundedRect = function(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
        ctx.stroke();
    };

    Window_Status.prototype.hexToRgba = function(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

})();


