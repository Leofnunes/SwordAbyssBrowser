
/*:
 * @target MZ
 * @plugindesc Redesenha a tela de salvar/carregar com estética escura e detalhes dourados.
 * @author Leandro Nunes
 * @url www.1337games.com.br
 *
 * @param maxVisibleSlots
 * @text Slots Visíveis
 * @type number
 * @min 1
 * @max 10
 * @default 4
 * @desc Quantidade de slots visíveis ao mesmo tempo na lista.
 *
 * @param accentColor
 * @text Cor de Destaque
 * @type string
 * @default #c8a84b
 * @desc Cor dourada principal usada para bordas e destaques (hex).
 *
 * @param panelBgColor
 * @text Cor de Fundo do Painel
 * @type string
 * @default #0a0e45
 * @desc Cor de fundo do painel de detalhes (hex).
 *
 * @help LuxurySaveScreen.js
 *
 * Substitui a tela de salvar/carregar padrão por um layout luxuoso:
 *   - Painel esquerdo: lista de slots com cartões decorados.
 *   - Painel direito: visualização detalhada do slot selecionado.
 *   - Cada cartão exibe: número do slot, título, tempo de jogo e faces.
 *
 * Sem comandos de plugin.
 */

(() => {
    "use strict";

    function hexToRgb(hex) {
        const clean = hex.replace("#", "");
        if (clean.length === 3) {
            return {
                r: parseInt(clean[0] + clean[0], 16),
                g: parseInt(clean[1] + clean[1], 16),
                b: parseInt(clean[2] + clean[2], 16),
            };
        }
        return {
            r: parseInt(clean.substring(0, 2), 16),
            g: parseInt(clean.substring(2, 4), 16),
            b: parseInt(clean.substring(4, 6), 16),
        };
    }

    function hexAlpha(hex, alpha) {
        const { r, g, b } = hexToRgb(hex);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    const PARAMS        = PluginManager.parameters("LuxurySaveScreen");
    const MAX_SLOTS     = parseInt(PARAMS.maxVisibleSlots || 4, 10);
    const ACCENT        = String(PARAMS.accentColor  || "#c8a84b");
    const PANEL_BG      = String(PARAMS.panelBgColor || "#0a0e45");
    const LIST_WIDTH_RATIO  = 0.42;
    const GUTTER            = 8;

    const _DataManager_makeSavefileInfo = DataManager.makeSavefileInfo;
    DataManager.makeSavefileInfo = function () {
        const info = _DataManager_makeSavefileInfo.call(this);
        info.lss_mapName = $gameMap
            ? ($dataMapInfos[$gameMap.mapId()]
                ? $dataMapInfos[$gameMap.mapId()].name
                : "—")
            : "—";
        info.lss_gold = $gameParty ? $gameParty.gold() : 0;
        if ($gameParty) {
            info.lss_members = $gameParty.members().map(actor => ({
                name:  actor.name(),
                level: actor.level
            }));
        } else {
            info.lss_members = [];
        }
        info.lss_battles = $gameSystem ? $gameSystem.battleCount() : 0;
        info.lss_saves = $gameSystem ? $gameSystem.saveCount() : 0;

        return info;
    };

    const _Scene_File_create = Scene_File.prototype.create;
    Scene_File.prototype.create = function () {
        _Scene_File_create.apply(this, arguments);
        this._listWindow.opacity = 192;
        if (this._helpWindow) this._helpWindow.opacity = 192;
        const listW  = Math.floor(Graphics.boxWidth * LIST_WIDTH_RATIO);
        const listH  = Graphics.boxHeight - this._listWindow.y;

        this._listWindow.width  = listW;
        this._listWindow.height = listH;
        this._listWindow.refresh();
        const detailX = listW + GUTTER;
        const detailY = this._listWindow.y;
        const detailW = Graphics.boxWidth - detailX;
        const detailH = listH;

        const rect          = new Rectangle(detailX, detailY, detailW, detailH);
        const detailWindow  = new Window_SaveDetail(rect);

        this._listWindow.lss_detailWindow = detailWindow;
        this.addWindow(detailWindow);
    };

    const _Scene_File_start = Scene_File.prototype.start;
    Scene_File.prototype.start = function () {
        _Scene_File_start.apply(this, arguments);
        this._listWindow.ensureCursorVisible();
        this._listWindow.callUpdateHelp();
    };
    Window_SavefileList.prototype.maxCols = function () {
        return 1;
    };
    Window_SavefileList.prototype.itemHeight = function () {
        return this.lineHeight() * 3 + 8;
    };
    Window_SavefileList.prototype.windowWidth = function () {
        return Math.floor(Graphics.boxWidth * LIST_WIDTH_RATIO);
    };
    const _Window_SavefileList_callUpdateHelp =
        Window_SavefileList.prototype.callUpdateHelp;
    Window_SavefileList.prototype.callUpdateHelp = function () {
        _Window_SavefileList_callUpdateHelp.apply(this, arguments);
        if (this.active && this.lss_detailWindow) {
            this.lss_detailWindow.setSavefileId(this.savefileId());
        }
    };

    Window_SavefileList.prototype.drawItem = function (index) {
        const savefileId = this.indexToSavefileId(index);
        const info       = DataManager.savefileInfo(savefileId);
        const valid      = this.isEnabled(savefileId);
        const rect       = this.itemRectWithPadding(index);
        const isSelected = (index === this.index());

        this._drawCardBackground(rect, isSelected, !!info);
        this._drawCardContent(rect, savefileId, info, valid, isSelected);
    };

    Window_SavefileList.prototype._drawCardBackground = function (rect, isSelected, hasData) {
        const ctx    = this.contents._context;
        const px     = rect.x;
        const py     = rect.y;
        const pw     = rect.width;
        const ph     = rect.height;
        const radius = 6;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(px + radius, py);
        ctx.lineTo(px + pw - radius, py);
        ctx.arcTo(px + pw, py,      px + pw, py + ph,      radius);
        ctx.arcTo(px + pw, py + ph, px,      py + ph,      radius);
        ctx.arcTo(px,      py + ph, px,      py,           radius);
        ctx.arcTo(px,      py,      px + pw, py,           radius);
        ctx.closePath();
        ctx.clip();
        if (isSelected) {
            ctx.fillStyle = hexAlpha(ACCENT, 0.15);
            ctx.fill();
        }
        ctx.strokeStyle = isSelected
            ? hexAlpha(ACCENT, 0.9)
            : "rgba(120,100,60,0.25)";
        ctx.lineWidth   = isSelected ? 1.5 : 0.8;
        ctx.stroke();

        ctx.restore();
    };

    Window_SavefileList.prototype._drawCardContent = function (
        rect, savefileId, info, valid, isSelected
    ) {
        const lh     = this.lineHeight();
        const pad    = 4;
        const x      = rect.x + pad;
        const y      = rect.y + pad;
        const w      = rect.width - pad * 2;
        const label  = savefileId === 0
            ? TextManager.autosave
            : TextManager.file + " " + savefileId;

        this.changeTextColor(
            isSelected ? ACCENT : ColorManager.normalColor()
        );
        this.contents.fontSize = 17;
        this.drawText(label, x, y, 90);
        const divX = x + 96;
        const ctx  = this.contents._context;
        ctx.save();
        ctx.strokeStyle = hexAlpha(ACCENT, isSelected ? 0.6 : 0.2);
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(divX, y + 2);
        ctx.lineTo(divX, y + lh - 2);
        ctx.stroke();
        ctx.restore();

        if (info) {
            this.changeTextColor(isSelected ? "#ffffff" : "#cccccc");
            this.contents.fontSize = 18;
            this.drawText(info.title || "—", divX + 8, y, w - 100, "left");
            if (info.faces) {
                const faceSize   = 36;
                const faceSpacing = faceSize + 4;
                const facesY     = y + lh + 2;
                for (let i = 0; i < Math.min(info.faces.length, 4); i++) {
                    const [faceName, faceIndex] = info.faces[i];
                    this._drawMiniFace(faceName, faceIndex,
                        x + i * faceSpacing, facesY, faceSize);
                }
            }
            this.changeTextColor(hexAlpha(ACCENT, 0.9));
            this.contents.fontSize = 16;
            this.drawText(info.playtime, x, y + lh * 2 - 2, w, "right");
        } else {
            this.changeTextColor("rgba(120,120,140,0.6)");
            this.contents.fontSize = 17;
            this.drawText("— " + (valid ? "Slot Vazio" : "Sem Dados") + " —",
                divX + 8, y, w - 100);
        }
        this.resetTextColor();
        this.contents.fontSize = $gameSystem.mainFontSize();
    };

    Window_SavefileList.prototype._drawMiniFace = function (
        faceName, faceIndex, x, y, size
    ) {
        const bitmap  = ImageManager.loadFace(faceName);
        const sw      = ImageManager.faceWidth;
        const sh      = ImageManager.faceHeight;
        const cols    = 4;
        const sx      = (faceIndex % cols) * sw;
        const sy      = Math.floor(faceIndex / cols) * sh;

        this.contents.blt(bitmap, sx, sy, sw, sh, x, y, size, size);
    };

    function Window_SaveDetail() {
        this.initialize.apply(this, arguments);
    }

    Window_SaveDetail.prototype = Object.create(Window_Base.prototype);
    Window_SaveDetail.prototype.constructor = Window_SaveDetail;

    Window_SaveDetail.prototype.initialize = function (rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this.opacity     = 192;
        this._savefileId = 1;
        this._animFrame  = 0;
        this.refresh();
    };

    Window_SaveDetail.prototype.setSavefileId = function (id) {
        if (this._savefileId !== id) {
            this._savefileId = id;
            this._animFrame  = 0;
            this.refresh();
        }
    };

    Window_SaveDetail.prototype.update = function () {
        Window_Base.prototype.update.call(this);
        if (this._animFrame < 30) {
            this._animFrame++;
            this.contentsOpacity = Math.min(255, Math.floor((this._animFrame / 30) * 255));
        }
    };

    Window_SaveDetail.prototype.refresh = function () {
        const info = DataManager.savefileInfo(this._savefileId);
        const c    = this.contents;
        c.clear();
        this.contentsOpacity = 0;
        this._animFrame      = 0;

        this._drawPanelBackground();

        if (info) {
            this._drawDetailContent(info);
        } else {
            this._drawEmptyState();
        }
    };

    Window_SaveDetail.prototype._drawPanelBackground = function () {
        const c   = this.contents;
        const ctx = c._context;
        const w   = c.width;
        const h   = c.height;

        ctx.save();
        const ruleY = Math.floor(h * 0.52);
        ctx.strokeStyle = hexAlpha(ACCENT, 0.3);
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(16, ruleY);
        ctx.lineTo(w - 16, ruleY);
        ctx.stroke();
        const dmX = w / 2;
        const dmY = ruleY;
        const dmR = 5;
        ctx.fillStyle = hexAlpha(ACCENT, 0.8);
        ctx.beginPath();
        ctx.moveTo(dmX,        dmY - dmR);
        ctx.lineTo(dmX + dmR,  dmY);
        ctx.lineTo(dmX,        dmY + dmR);
        ctx.lineTo(dmX - dmR,  dmY);
        ctx.closePath();
        ctx.fill();
        this._drawCornerBracket(ctx, 10, 10, 20, 20, 1.5);
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        this._drawCornerBracket(ctx, 10, 10, 20, 20, 1.5);
        ctx.restore();
        ctx.save();
        ctx.translate(0, h);
        ctx.scale(1, -1);
        this._drawCornerBracket(ctx, 10, 10, 20, 20, 1.5);
        ctx.restore();
        ctx.save();
        ctx.translate(w, h);
        ctx.scale(-1, -1);
        this._drawCornerBracket(ctx, 10, 10, 20, 20, 1.5);
        ctx.restore();

        ctx.restore();
    };

    Window_SaveDetail.prototype._drawCornerBracket = function (
        ctx, ox, oy, lx, ly, lineWidth
    ) {
        ctx.strokeStyle = hexAlpha(ACCENT, 0.75);
        ctx.lineWidth   = lineWidth;
        ctx.lineJoin    = "miter";
        ctx.beginPath();
        ctx.moveTo(ox + lx, oy);
        ctx.lineTo(ox,      oy);
        ctx.lineTo(ox,      oy + ly);
        ctx.stroke();
    };

    Window_SaveDetail.prototype._drawDetailContent = function (info) {
        const c   = this.contents;
        const w   = c.width;
        const lh  = this.lineHeight();
        const pad = 18;
        const slotLabel = this._savefileId === 0
            ? TextManager.autosave
            : TextManager.file + " " + this._savefileId;

        c.fontSize = 19;
        this.changeTextColor(hexAlpha(ACCENT, 0.85));
        this.drawText(slotLabel.toUpperCase(), pad, pad, w - pad * 2);
        c.fontSize = 23;
        this.changeTextColor("#ffffff");
        this.drawText(info.title || "—", pad, pad + 22, w - pad * 2);
        const faceSize    = 80;
        const faceSpacing = faceSize + 10;
        const facesY      = pad + 22 + lh + 12;
        const members     = info.lss_members || [];

        if (info.faces && info.faces.length > 0) {
            const count  = Math.min(info.faces.length, 4);
            const totalW = count * faceSpacing - 10;
            const startX = Math.max(pad, Math.floor((w - totalW) / 2));

            for (let i = 0; i < count; i++) {
                const [faceName, faceIndex] = info.faces[i];
                const fx     = startX + i * faceSpacing;
                const member = members[i] || null;
                this._drawLargeFace(faceName, faceIndex, fx, facesY, faceSize, member);
            }
        }
        const infoTopY = facesY + faceSize + 4 + 18 + 18 + 20;
        this._drawInfoRow("⏱  Tempo de Jogo", info.playtime,
            pad, infoTopY, w - pad * 2);
        if (info.timestamp) {
            const ts      = new Date(info.timestamp);
            const dateStr = ts.toLocaleDateString(undefined, {
                year: "numeric", month: "short", day: "numeric"
            });
            const timeStr = ts.toLocaleTimeString(undefined, {
                hour: "2-digit", minute: "2-digit"
            });
            this._drawInfoRow("📅  Salvo em",
                dateStr + "  " + timeStr,
                pad, infoTopY + lh + 8, w - pad * 2);
        }
        if (info.lss_mapName) {
            this._drawInfoRow("🗺  Localização", info.lss_mapName,
                pad, infoTopY + (lh + 8) * 2, w - pad * 2);
        }
        if (info.lss_gold !== undefined) {
            const goldStr = info.lss_gold.toLocaleString() + " " + TextManager.currencyUnit;
            this._drawInfoRow("💰  Ouro", goldStr,
                pad, infoTopY + (lh + 8) * 3, w - pad * 2);
        }
        if (info.lss_battles !== undefined) {
            const battleStr = info.lss_battles.toLocaleString() + " batalhas";
            this._drawInfoRow("⚔  Batalhas", battleStr,
                pad, infoTopY + (lh + 8) * 4, w - pad * 2);
        }
        if (info.lss_saves !== undefined) {
            const saveStr = info.lss_saves.toLocaleString() + " saves";
            this._drawInfoRow("💾  Total de Saves", saveStr,
                pad, infoTopY + (lh + 8) * 5, w - pad * 2);
        }

        this.resetTextColor();
        c.fontSize = $gameSystem.mainFontSize();
    };

    Window_SaveDetail.prototype._drawInfoRow = function (label, value, x, y, w) {
        const c = this.contents;

        c.fontSize = 18;
        this.changeTextColor(hexAlpha(ACCENT, 0.7));
        this.drawText(label, x, y, w * 0.5);

        c.fontSize = 17;
        this.changeTextColor("#e8e8e8");
        this.drawText(value, x, y, w, "right");
    };

    Window_SaveDetail.prototype._drawLargeFace = function (
        faceName, faceIndex, x, y, size, member
    ) {
        const bitmap  = ImageManager.loadFace(faceName);
        const sw      = ImageManager.faceWidth;
        const sh      = ImageManager.faceHeight;
        const cols    = 4;
        const sx      = (faceIndex % cols) * sw;
        const sy      = Math.floor(faceIndex / cols) * sh;
        const ctx    = this.contents._context;
        const cx     = x + size / 2;
        const cy     = y + size / 2;
        const radius = size / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
        ctx.clip();
        this.contents.blt(bitmap, sx, sy, sw, sh, x, y, size, size);
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = hexAlpha(ACCENT, 0.85);
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        if (member) {
            const c       = this.contents;
            const nameY   = y + size + 4;
            const levelY  = nameY + 18;

            c.fontSize = 14;
            this.changeTextColor("#e8e8e8");
            this.drawText(member.name, x - 4, nameY, size + 8, "center");

            c.fontSize = 13;
            this.changeTextColor(hexAlpha(ACCENT, 0.9));
            this.drawText("Nv. " + member.level, x - 4, levelY, size + 8, "center");

            this.resetTextColor();
        }
    };

    Window_SaveDetail.prototype._drawEmptyState = function () {
        const c   = this.contents;
        const w   = c.width;
        const h   = c.height;

        c.fontSize = 19;
        this.changeTextColor(hexAlpha(ACCENT, 0.45));
        this.drawText("— Sem Dados de Save —", 0, Math.floor(h / 2) - 12, w, "center");
        c.fontSize = 18;
        this.changeTextColor("rgba(160,140,100,0.3)");
        this.drawText("Selecione este slot para iniciar uma nova jornada.",
            0, Math.floor(h / 2) + 14, w, "center");

        this.resetTextColor();
        c.fontSize = $gameSystem.mainFontSize();
    };

})();


