
/*:
@target MZ
@plugindesc 1.2.0 Redesigns both battle command windows (Fight/Escape and
actor commands) with a larger medieval fantasy style. Position via pixels,
with separate coordinates for 16:9 and 4:3 screen ratios.
@author Leandro Nunes
@url www.1337games.com.br

@help
============================================================================
BattleCommandWindows - Version 1.2.0
============================================================================

Replaces both battle command windows with a larger, styled panel.
Positions are defined directly in pixels — no auto-positioning logic.

Dois conjuntos de coordenadas podem ser configurados:
  • Um para telas 16:9 (ex: 1280×720)
  • Um para telas 4:3  (ex: 640×480)

A detecção da proporção é automática em tempo de execução.

Para alterar as posições, edite diretamente o bloco CFG no início do
código JavaScript — procure por "COORDENADAS 16:9" e "COORDENADAS 4:3".

Referência de tela (resolução padrão MZ):
  16:9 → 1280×720  |  X: 0 = esquerda, 1280 = direita
  4:3  →  640×480  |  X: 0 = esquerda,  640 = direita

============================================================================

@param --- Party Command ---

@param partyWindowWidth
@text [Party] Window Width (px)
@type number
@min 160
@max 600
@desc Width of the Fight/Escape window.
@default 280

@param partyItemHeight
@text [Party] Item Height (px)
@type number
@min 36
@max 120
@desc Height of each row in the Fight/Escape window.
@default 68

@param --- Actor Command ---

@param actorWindowWidth
@text [Actor] Window Width (px)
@type number
@min 160
@max 600
@desc Width of the actor command window (Attack, Magic, etc.).
@default 280

@param actorItemHeight
@text [Actor] Item Height (px)
@type number
@min 36
@max 120
@desc Height of each row in the actor command window.
@default 68

@param --- Estilo Geral ---

@param fontSize
@text Tamanho da Fonte (px)
@type number
@min 16
@max 48
@desc Tamanho da fonte usado nas duas janelas.
@default 26

@param accentColor
@text Cor de Destaque
@type text
@desc Cor dos divisores e do destaque do item selecionado (hex ou rgba).
@default #c8a84b

@param dimColor
@text Cor Suave da Seleção
@type text
@desc Cor de preenchimento de fundo do item selecionado (recomenda-se rgba).
@default rgba(180,140,60,0.28)

@param showOrnament
@text Mostrar Divisores Ornamentais
@type boolean
@desc Desenha uma linha dourada fina entre cada item de comando.
@default true

@param commandIcons
@text Mostrar Ícones dos Comandos
@type boolean
@desc Desenha um pequeno ícone ao lado de cada nome de comando.
@default true
*/

(() => {
    'use strict';

    const pluginName = 'BattleCommandWindows';
    const params     = PluginManager.parameters(pluginName);
    const POS_16_9 = {
        partyX :  860,
        partyY :  480,
        actorX :  860,
        actorY :  414,
    };
    const POS_4_3 = {
        partyX :  342,
        partyY :  396,
        actorX :  342,
        actorY :  204,
    };
    function getPos() {
        const ratio = Graphics.boxWidth / Graphics.boxHeight;
        return ratio > 1.55 ? POS_16_9 : POS_4_3;
    }
    const CFG = {
        partyWindowWidth : parseInt(params.partyWindowWidth) || 280,
        partyItemHeight  : parseInt(params.partyItemHeight)  || 68,
        actorWindowWidth : parseInt(params.actorWindowWidth) || 280,
        actorItemHeight  : parseInt(params.actorItemHeight)  || 48,
        fontSize         : parseInt(params.fontSize)         || 26,
        accentColor      : params.accentColor                || '#c8a84b',
        dimColor         : params.dimColor                   || 'rgba(180,140,60,0.28)',
        showOrnament     : params.showOrnament !== 'false',
        commandIcons     : params.commandIcons !== 'false',
    };
    const SYMBOL_ICONS = {
        fight  : 76,
        escape : 82,
        attack : 76,
        skill  : 79,
        guard  : 81,
        item   : 208,
    };
    function drawCommandBackground(win, index, accentColor, dimColor, showOrnament) {
        const rect = win.itemLineRect(index);

        if (index === win.index()) {
            const ctx = win.contents._context;
            if (ctx) {
                ctx.save();
                ctx.fillStyle = dimColor;
                ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
                ctx.fillStyle = accentColor;
                ctx.fillRect(rect.x, rect.y + 4, 4, rect.height - 8);
                ctx.restore();
            }
        }

        if (showOrnament && index < win.maxItems() - 1) {
            const ctx = win.contents._context;
            if (ctx) {
                ctx.save();
                ctx.strokeStyle = accentColor;
                ctx.globalAlpha = 0.35;
                ctx.lineWidth   = 1;
                ctx.beginPath();
                const lineY = rect.y + rect.height - 1;
                ctx.moveTo(rect.x + 8,              lineY);
                ctx.lineTo(rect.x + rect.width - 8, lineY);
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    function drawCommandItem(win, index, fontSize, accentColor, commandIcons) {
        const rect    = win.itemLineRect(index);
        const symbol  = win.commandSymbol(index);
        const name    = win.commandName(index);
        const icon    = SYMBOL_ICONS[symbol];
        const enabled = win.isCommandEnabled(index);

        win.resetFontSettings();
        win.changePaintOpacity(enabled);

        let textX   = rect.x + 12;
        const textY = rect.y + Math.floor((rect.height - fontSize) / 2) - 2;

        if (commandIcons && icon !== undefined) {
            const iconSize = 32;
            const iconY    = rect.y + Math.floor((rect.height - iconSize) / 2);
            win.drawIcon(icon, textX, iconY);
            textX += iconSize + 10;
        }

        if (index === win.index() && enabled) {
            win.changeTextColor(accentColor);
        } else {
            win.resetTextColor();
        }

        win.contents.drawText(
            name,
            textX,
            textY,
            rect.width - textX - 8,
            fontSize + 4,
            'left'
        );

        win.changePaintOpacity(true);
        win.resetTextColor();
    }

    Scene_Battle.prototype.partyCommandWindowRect = function() {
        const pos = getPos();
        const ww  = CFG.partyWindowWidth;
        const wh  = Window_PartyCommand.prototype.fittingHeight(2);
        return new Rectangle(pos.partyX, pos.partyY, ww, wh);
    };

    Window_PartyCommand.prototype.itemHeight = function() {
        return CFG.partyItemHeight;
    };

    const _WPC_resetFontSettings = Window_PartyCommand.prototype.resetFontSettings;
    Window_PartyCommand.prototype.resetFontSettings = function() {
        _WPC_resetFontSettings.call(this);
        this.contents.fontSize = CFG.fontSize;
    };

    Window_PartyCommand.prototype.numVisibleRows = function() {
        return this.maxItems();
    };

    Window_PartyCommand.prototype.drawItemBackground = function(index) {
        drawCommandBackground(this, index, CFG.accentColor, CFG.dimColor, CFG.showOrnament);
    };

    Window_PartyCommand.prototype.drawItem = function(index) {
        drawCommandItem(this, index, CFG.fontSize, CFG.accentColor, CFG.commandIcons);
    };

    const _WPC_select = Window_PartyCommand.prototype.select;
    Window_PartyCommand.prototype.select = function(index) {
        _WPC_select.call(this, index);
        this.refresh();
    };

    const _Scene_Battle_createPartyCommandWindow =
        Scene_Battle.prototype.createPartyCommandWindow;
    Scene_Battle.prototype.createPartyCommandWindow = function() {
        _Scene_Battle_createPartyCommandWindow.call(this);
        if (this._partyCommandWindow) {
            this._partyCommandWindow.opacity = 220;
        }
    };

    Scene_Battle.prototype.actorCommandWindowRect = function() {
        const pos = getPos();
        const ww  = CFG.actorWindowWidth;
        const wh  = Window_ActorCommand.prototype.fittingHeight(4);
        return new Rectangle(pos.actorX, pos.actorY, ww, wh);
    };

    Window_ActorCommand.prototype.itemHeight = function() {
        return CFG.actorItemHeight;
    };

    const _WAC_resetFontSettings = Window_ActorCommand.prototype.resetFontSettings;
    Window_ActorCommand.prototype.resetFontSettings = function() {
        _WAC_resetFontSettings.call(this);
        this.contents.fontSize = CFG.fontSize;
    };

    Window_ActorCommand.prototype.numVisibleRows = function() {
        return this.maxItems();
    };

    Window_ActorCommand.prototype.drawItemBackground = function(index) {
        drawCommandBackground(this, index, CFG.accentColor, CFG.dimColor, CFG.showOrnament);
    };

    Window_ActorCommand.prototype.drawItem = function(index) {
        drawCommandItem(this, index, CFG.fontSize, CFG.accentColor, CFG.commandIcons);
    };

    const _WAC_select = Window_ActorCommand.prototype.select;
    Window_ActorCommand.prototype.select = function(index) {
        _WAC_select.call(this, index);
        this.refresh();
    };

    const _Scene_Battle_createActorCommandWindow =
        Scene_Battle.prototype.createActorCommandWindow;
    Scene_Battle.prototype.createActorCommandWindow = function() {
        _Scene_Battle_createActorCommandWindow.call(this);
        if (this._actorCommandWindow) {
            this._actorCommandWindow.opacity = 220;
        }
    };

})();


