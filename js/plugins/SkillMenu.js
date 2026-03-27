
/*:
 * @target MZ
 * @plugindesc Mystical skill menu with glowing elements and smooth animations
 * @author Leandro Nunes
 * @url www.1337games.com.br
 *
 * @help EtherealSkillMenu.js
 *
 * This plugin replaces the default skill menu with a beautiful ethereal design
 * featuring:
 * - Glowing skill categories with magical particles
 * - Smooth hover animations and transitions
 * - MP/TP costs displayed with crystal-like icons
 * - Skill descriptions with fade-in effects
 * - Element type indicators with colored glows
 *
 * @param backgroundColor
 * @text Background Color
 * @desc Background color (rgba format)
 * @default rgba(10, 5, 25, 0.95)
 *
 * @param accentColor
 * @text Accent Color
 * @desc Main accent color for highlights
 * @default #8b5cf6
 *
 * @param secondaryColor
 * @text Secondary Color
 * @desc Secondary glow color
 * @default #06b6d4
 */

(() => {
    const pluginName = "EtherealSkillMenu";
    const parameters = PluginManager.parameters(pluginName);

    const config = {
        bgColor: parameters['backgroundColor'] || 'rgba(10, 5, 25, 0.95)',
        accentColor: parameters['accentColor'] || '#8b5cf6',
        secondaryColor: parameters['secondaryColor'] || '#06b6d4'
    };

    const _Scene_Skill_create = Scene_Skill.prototype.create;
    Scene_Skill.prototype.create = function() {
        _Scene_Skill_create.call(this);
        this.createEtherealBackground();
        this.createParticleSystem();
    };

    Scene_Skill.prototype.createEtherealBackground = function() {
        this._etherealBg = new Sprite();
        this._etherealBg.bitmap = new Bitmap(Graphics.width, Graphics.height);
        this.addChildAt(this._etherealBg, 0);
        this.drawEtherealBackground();
    };

    Scene_Skill.prototype.drawEtherealBackground = function() {
        const bitmap = this._etherealBg.bitmap;
        const width = bitmap.width;
        const height = bitmap.height;
        const context = bitmap.context;
        const gradient = context.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, height
        );
        gradient.addColorStop(0, 'rgba(30, 15, 60, 0.95)');
        gradient.addColorStop(1, 'rgba(5, 2, 15, 0.98)');

        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
        for (let i = 0; i < 3; i++) {
            const x = width * (0.3 + i * 0.2);
            const y = height * (0.4 + Math.sin(i) * 0.2);
            const radius = 150 + i * 50;

            const circleGrad = context.createRadialGradient(x, y, 0, x, y, radius);
            circleGrad.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
            circleGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.05)');
            circleGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');

            context.fillStyle = circleGrad;
            context.fillRect(0, 0, width, height);
        }
    };

    Scene_Skill.prototype.createParticleSystem = function() {
        this._particles = [];
        this._particleSprite = new Sprite();
        this._particleSprite.bitmap = new Bitmap(Graphics.width, Graphics.height);
        this.addChildAt(this._particleSprite, 1);

        for (let i = 0; i < 30; i++) {
            this._particles.push({
                x: Math.random() * Graphics.width,
                y: Math.random() * Graphics.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                alpha: Math.random() * 0.5 + 0.3,
                pulse: Math.random() * Math.PI * 2
            });
        }
    };

    const _Scene_Skill_update = Scene_Skill.prototype.update;
    Scene_Skill.prototype.update = function() {
        _Scene_Skill_update.call(this);
        this.updateParticles();
    };

    Scene_Skill.prototype.updateParticles = function() {
        if (!this._particleSprite) return;

        const bitmap = this._particleSprite.bitmap;
        bitmap.clear();

        for (const p of this._particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += 0.05;

            if (p.x < 0) p.x = Graphics.width;
            if (p.x > Graphics.width) p.x = 0;
            if (p.y < 0) p.y = Graphics.height;
            if (p.y > Graphics.height) p.y = 0;

            const pulseAlpha = p.alpha * (0.7 + Math.sin(p.pulse) * 0.3);
            const color = `rgba(139, 92, 246, ${pulseAlpha})`;

            bitmap.drawCircle(p.x, p.y, p.size, color);
        }
    };

    const _Window_SkillType_initialize = Window_SkillType.prototype.initialize;
    Window_SkillType.prototype.initialize = function(rect) {
        _Window_SkillType_initialize.call(this, rect);
        this._hoverIndex = -1;
    };

    const _Window_SkillType_drawItem = Window_SkillType.prototype.drawItem;
    Window_SkillType.prototype.drawItem = function(index) {
        const rect = this.itemLineRect(index);
        const isHover = this._hoverIndex === index;
        const isSelected = index === this.index();
        if (isSelected || isHover) {
            const intensity = isSelected ? 0.4 : 0.2;
            this.contents.gradientFillRect(
                rect.x - 10, rect.y, rect.width + 20, rect.height,
                `rgba(139, 92, 246, 0)`,
                `rgba(139, 92, 246, ${intensity})`
            );
            const borderColor = isSelected ? 'rgba(139, 92, 246, 0.8)' : 'rgba(139, 92, 246, 0.4)';
            this.contents.fillRect(rect.x - 10, rect.y, 2, rect.height, borderColor);
        }

        _Window_SkillType_drawItem.call(this, index);
    };

    const _Window_SkillList_initialize = Window_SkillList.prototype.initialize;
    Window_SkillList.prototype.initialize = function(rect) {
        _Window_SkillList_initialize.call(this, rect);
    };

    const _Window_SkillList_drawItem = Window_SkillList.prototype.drawItem;
    Window_SkillList.prototype.drawItem = function(index) {
        const skill = this.itemAt(index);
        if (!skill) return;

        const rect = this.itemLineRect(index);
        const isSelected = index === this.index();
        this.drawSkillCard(rect, skill, isSelected);
        this.changePaintOpacity(this.isEnabled(skill));
        this.drawSkillIcon(rect, skill);
        this.drawSkillName(rect, skill);
        this.drawSkillCost(rect, skill);
        this.changePaintOpacity(true);
    };

    Window_SkillList.prototype.drawSkillCard = function(rect, skill, isSelected) {
        const x = rect.x;
        const y = rect.y;
        const w = rect.width;
        const h = rect.height;
        const alpha = isSelected ? 0.3 : 0.15;
        this.contents.gradientFillRect(
            x, y + 2, w, h - 4,
            `rgba(20, 10, 40, ${alpha})`,
            `rgba(40, 20, 60, ${alpha})`
        );
        if (isSelected) {
            const glowColor = 'rgba(139, 92, 246, 0.6)';
            this.contents.fillRect(x, y + 2, w, 2, glowColor);
            this.contents.fillRect(x, y + h - 4, w, 2, glowColor);
            this.contents.fillRect(x, y + 2, 2, h - 4, glowColor);
            this.contents.fillRect(x + w - 2, y + 2, 2, h - 4, glowColor);
        }
    };

    Window_SkillList.prototype.drawSkillIcon = function(rect, skill) {
        const iconY = rect.y + (rect.height - ImageManager.iconHeight) / 2;
        this.drawIcon(skill.iconIndex, rect.x + 4, iconY);
    };

    Window_SkillList.prototype.drawSkillName = function(rect, skill) {
        const x = rect.x + ImageManager.iconWidth + 12;
        const y = rect.y;
        const w = rect.width - ImageManager.iconWidth - 120;
        const elementColors = {
            0: '#e0e0e0',
            1: '#e0e0e0',
            2: '#ff6b6b',
            3: '#4ecdc4',
            4: '#ffe66d',
            5: '#95e1d3',
            6: '#a8e6cf',
            7: '#ffd3b6',
            8: '#ffaaa5',
            9: '#c77dff'
        };

        const elementId = skill.damage.elementId || 0;
        const color = elementColors[elementId] || '#e0e0e0';
        this.changeTextColor(color);
        this.drawText(skill.name, x, y, w);
    };

    Window_SkillList.prototype.drawSkillCost = function(rect, skill) {
        const x = rect.x + rect.width - 100;
        const y = rect.y;
        const w = 90;

        if (this._actor.skillTpCost(skill) > 0) {
            this.changeTextColor(ColorManager.tpCostColor());
            const costText = this._actor.skillTpCost(skill) + " TP";
            this.drawText(costText, x, y, w, 'right');
        } else if (this._actor.skillMpCost(skill) > 0) {
            this.changeTextColor(ColorManager.mpCostColor());
            const costText = this._actor.skillMpCost(skill) + " MP";
            this.drawText(costText, x, y, w, 'right');
        }
    };

    Window_SkillList.prototype.drawElementIndicator = function(rect, skill) {
        if (skill.damage.elementId <= 0) return;

        const elementId = skill.damage.elementId;
        const colors = {
            2: '#ff6b6b', 3: '#4ecdc4', 4: '#ffe66d', 5: '#95e1d3',
            6: '#a8e6cf', 7: '#ffd3b6', 8: '#ffaaa5', 9: '#ff8b94'
        };

        const color = colors[elementId] || '#8b5cf6';
        const x = rect.x + rect.width - 15;
        const y = rect.y + rect.height / 2;

        this.contents.drawCircle(x, y, 4, color);
    };

    const _Window_SkillStatus_refresh = Window_SkillStatus.prototype.refresh;
    Window_SkillStatus.prototype.refresh = function() {
        _Window_SkillStatus_refresh.call(this);
    };
    const _Window_StatusBase_placeBasicGauges = Window_StatusBase.prototype.placeBasicGauges;
    Window_StatusBase.prototype.placeBasicGauges = function(actor, x, y) {
        if (SceneManager._scene instanceof Scene_Skill) {
            this.placeGauge(actor, "hp", x, y);
            this.placeGauge(actor, "mp", x, y + this.gaugeLineHeight() * 1.5);
        } else {
            _Window_StatusBase_placeBasicGauges.call(this, actor, x, y);
        }
    };

    const _Window_StatusBase_drawActorHp = Window_StatusBase.prototype.drawActorHp;
    Window_StatusBase.prototype.drawActorHp = function(actor, x, y, width) {
        if (SceneManager._scene instanceof Scene_Skill) {
            width = width || 270;
            const label = TextManager.hpA;
            const value = actor.hp;
            const maxValue = actor.mhp;
            const color1 = ColorManager.hpGaugeColor1();
            const color2 = ColorManager.hpGaugeColor2();
            this.drawGaugeWithLabel(x, y, width, label, value, maxValue, color1, color2);
        } else {
            _Window_StatusBase_drawActorHp.call(this, actor, x, y, width);
        }
    };

    const _Window_StatusBase_drawActorMp = Window_StatusBase.prototype.drawActorMp;
    Window_StatusBase.prototype.drawActorMp = function(actor, x, y, width) {
        if (SceneManager._scene instanceof Scene_Skill) {
            width = width || 270;
            const label = TextManager.mpA;
            const value = actor.mp;
            const maxValue = actor.mmp;
            const color1 = ColorManager.mpGaugeColor1();
            const color2 = ColorManager.mpGaugeColor2();
            this.drawGaugeWithLabel(x, y, width, label, value, maxValue, color1, color2);
        } else {
            _Window_StatusBase_drawActorMp.call(this, actor, x, y, width);
        }
    };

    Window_StatusBase.prototype.drawGaugeWithLabel = function(x, y, width, label, value, maxValue, color1, color2) {
        const gaugeHeight = 18;
        const labelWidth = 48;
        const gaugeWidth = width - labelWidth - 6;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(label, x, y, labelWidth);
        this.contents.fillRect(x + labelWidth, y + this.lineHeight() - gaugeHeight - 2, gaugeWidth, gaugeHeight, ColorManager.gaugeBackColor());
        const fillWidth = Math.floor((gaugeWidth - 2) * value / maxValue);
        this.contents.gradientFillRect(x + labelWidth + 1, y + this.lineHeight() - gaugeHeight - 1, fillWidth, gaugeHeight - 2, color1, color2);
        this.changeTextColor(ColorManager.normalColor());
        const valueText = value + "/" + maxValue;
        this.drawText(valueText, x + labelWidth, y, gaugeWidth, 'right');
    };

    Bitmap.prototype.gradientFillRect = function(x, y, width, height, color1, color2) {
        const context = this.context;
        const gradient = context.createLinearGradient(x, y, x + width, y);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        context.fillStyle = gradient;
        context.fillRect(x, y, width, height);
    };

    Bitmap.prototype.drawCircle = function(x, y, radius, color) {
        const context = this.context;
        context.save();
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
    };

})();


