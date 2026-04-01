/*:
 * @target MZ
 * @plugindesc [v2.0] Menu de Itens em grade moderna com painel de efeitos detalhado
 * @author Leandro Nunes
 * @url www.1337games.com.br
 *
 * @param gridColumns
 * @text Colunas da Grade
 * @type number
 * @min 2
 * @max 6
 * @default 4
 * @desc Número de colunas na grade de itens.
 *
 * @param previewWidthPercent
 * @text Largura do Painel de Detalhe (%)
 * @type number
 * @min 25
 * @max 50
 * @default 36
 * @desc Porcentagem da largura da tela usada pelo painel de detalhes.
 *
 * @param accentColor
 * @text Cor de Destaque (hex)
 * @type string
 * @default #c8a96e
 * @desc Cor principal usada em bordas, ícones ativos e títulos de seção.
 *
 * @param animatePulse
 * @text Animar Item Selecionado
 * @type boolean
 * @default true
 * @desc Ativa o pulso suave no card selecionado.
 *
 * @help
 * ============================================================================
 * Modern Grid Item Menu v2.0 — Leandro Nunes (1337Games)
 * ============================================================================
 *
 * Redesenha completamente o menu de itens com:
 *   - Grade com cards visuais (ícone grande + nome + badge de quantidade)
 *   - Painel lateral com DESCRIÇÃO e EFEITOS detalhados do item:
 *       · Recuperação de HP / MP / TP (percentual e fixo)
 *       · Estados aplicados e removidos (com nome e chance)
 *       · Buffs e debuffs de atributos
 *       · Habilidades ensinadas
 *       · Ganho permanente de atributo (Grow)
 *       · Eventos comuns
 *   - Sistema de raridade por cor (barra lateral + badge)
 *   - Tabs de categoria com ícone + label
 *   - Pulso animado no card selecionado
 *   - Sem dependências externas
 *
 * ============================================================================
 */

(() => {
    'use strict';

    // =========================================================================
    //  Parâmetros
    // =========================================================================

    const PLUGIN_NAME          = 'ModernGridItemMenu';
    const params               = PluginManager.parameters(PLUGIN_NAME);
    const GRID_COLS            = Math.max(2, Math.min(6, Number(params['gridColumns']         || 4)));
    const PREVIEW_RATIO        = Math.max(0.25, Math.min(0.50, Number(params['previewWidthPercent'] || 40) / 100));
    const ACCENT               = String(params['accentColor'] || '#c8a96e');
    const ANIMATE_PULSE        = params['animatePulse'] !== 'false';

    const CAT_HEIGHT = 68;      // altura da barra de categorias — layout horizontal (ícone + texto)

    // =========================================================================
    //  Ícones por categoria
    // =========================================================================

    const CATEGORY_ICONS = { item: 176, weapon: 97, armor: 135, keyItem: 195 };

    // =========================================================================
    //  Raridade — baseada no tipo e preço do item
    // =========================================================================

    function itemRarity(item) {
        if (!item) return { label: '',            color: '#7f8c8d', tier: 0 };
        if (item.itypeId === 2)     return { label: 'Especial',   color: '#ffd700', tier: 4 };
        if (item.price > 5000)      return { label: 'Raro',       color: '#a855f7', tier: 3 };
        if (item.price > 1000)      return { label: 'Incomum',    color: '#3b82f6', tier: 2 };
        if (item.price > 100)       return { label: 'Comum',      color: '#22c55e', tier: 1 };
        return                             { label: 'Básico',     color: '#94a3b8', tier: 0 };
    }

    // =========================================================================
    //  Utilitário: desenhar ícone escalado
    // =========================================================================

    function drawScaledIcon(contents, iconIndex, x, y, size) {
        const bmp = ImageManager.loadSystem('IconSet');
        const pw  = ImageManager.iconWidth;
        const ph  = ImageManager.iconHeight;
        const sx  = (iconIndex % 16) * pw;
        const sy  = Math.floor(iconIndex / 16) * ph;
        contents.blt(bmp, sx, sy, pw, ph, Math.floor(x), Math.floor(y), size, size);
    }

    // =========================================================================
    //  Utilitário: retângulo arredondado simulado via fillRect multicamada
    //  (RMMZ canvas não tem borderRadius; simulamos com cantos escuros)
    // =========================================================================

    function fillRoundRect(contents, x, y, w, h, color, r = 6) {
        // camada central
        contents.fillRect(x + r, y,     w - r * 2, h,     color);
        contents.fillRect(x,     y + r, w,         h - r * 2, color);
        // quatro cantos
        const c = contents._context;
        c.save();
        c.fillStyle = color;
        c.beginPath();
        c.arc(x + r,     y + r,     r, Math.PI,       1.5 * Math.PI);
        c.arc(x + w - r, y + r,     r, 1.5 * Math.PI, 0);
        c.arc(x + w - r, y + h - r, r, 0,             0.5 * Math.PI);
        c.arc(x + r,     y + h - r, r, 0.5 * Math.PI, Math.PI);
        c.closePath();
        c.fill();
        c.restore();
    }

    // =========================================================================
    //  Scene_Item — reposiciona e cria janelas
    // =========================================================================

    const _Scene_Item_create = Scene_Item.prototype.create;
    Scene_Item.prototype.create = function () {
        _Scene_Item_create.call(this);
        this._applyModernLayout();
    };

    Scene_Item.prototype._applyModernLayout = function () {
        const totalW   = Graphics.boxWidth;
        const totalH   = Graphics.boxHeight;
        const previewW = Math.floor(totalW * PREVIEW_RATIO);
        const gridW    = totalW - previewW;
        const contentH = totalH - CAT_HEIGHT;

        // --- Categoria ---
        this._categoryWindow.move(0, 0, totalW, CAT_HEIGHT);

        // --- Grade de itens ---
        this._itemWindow.move(0, CAT_HEIGHT, gridW, contentH);

        // --- Painel de detalhe ---
        const detailRect = new Rectangle(gridW, CAT_HEIGHT, previewW, contentH);
        this._detailWindow = new Window_ItemDetail(detailRect);
        this.addWindow(this._detailWindow);

        // Conecta grade → detalhe
        this._itemWindow.setDetailWindow(this._detailWindow);

        // Dispara detalhe inicial
        this._detailWindow.setItem(this._itemWindow.item());
    };

    // =========================================================================
    //  Window_ItemCategory — tabs compactas com ícone + texto
    // =========================================================================

    Window_ItemCategory.prototype.maxCols = function () { return 4; };

    // itemHeight deve ser igual ao espaço interno real da janela.
    // Se retornar CAT_HEIGHT (altura total), o conteúdo fica maior que a área
    // visível e o RMMZ ativa scroll interno — causando o deslocamento ao navegar.
    Window_ItemCategory.prototype.itemHeight = function () { return this.innerHeight; };

    // Garante que nunca haverá mais de uma linha (sem scroll vertical)
    Window_ItemCategory.prototype.maxRows = function () { return 1; };

    // Oculta o cursor e setas padrão do RMMZ — usamos highlight visual próprio
    Window_ItemCategory.prototype.updateCursor = function () {
        this.setCursorRect(0, 0, 0, 0);
    };

    Window_ItemCategory.prototype._updateArrows = function () {
        this._downArrowSprite.visible = false;
        this._upArrowSprite.visible   = false;
    };

    Window_ItemCategory.prototype.drawItem = function (index) {
        const rect   = this.itemLineRect(index);
        const symbol = this.commandSymbol(index);
        const name   = this.commandName(index);
        const icon   = CATEGORY_ICONS[symbol] || 0;
        const active = (index === this.index());

        this.resetTextColor();

        // Fundo + barra vertical de seleção à esquerda
        if (active) {
            this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, 'rgba(255,255,255,0.07)');
            this.contents.fillRect(rect.x, rect.y + 6, 3, rect.height - 12, ACCENT);
        }

        this.changePaintOpacity(active);

        // Ícone centralizado verticalmente, colado à esquerda com margem
        const PAD   = 12;
        const iconH = ImageManager.iconHeight;
        const iconY = rect.y + Math.floor((rect.height - iconH) / 2);
        this.drawIcon(icon, rect.x + PAD, iconY);

        // Texto logo após o ícone, centralizado verticalmente
        const textX = rect.x + PAD + ImageManager.iconWidth + 8;
        const textW = rect.x + rect.width - textX - PAD;
        const textY = rect.y + Math.floor((rect.height - this.lineHeight()) / 2);
        this.contents.fontSize = 16;
        if (active) this.changeTextColor(ACCENT);
        this.drawText(name, textX, textY, textW, 'left');
        this.contents.fontSize = $gameSystem.mainFontSize();

        this.changePaintOpacity(true);
        this.resetTextColor();
    };

    // =========================================================================
    //  Window_ItemList — grade de cards
    // =========================================================================

    Window_ItemList.prototype.maxCols    = function () { return GRID_COLS; };
    Window_ItemList.prototype.itemHeight = function () { return 112; };

    Window_ItemList.prototype.setDetailWindow = function (win) {
        this._detailWindow = win;
    };

    const _WIL_select = Window_ItemList.prototype.select;
    Window_ItemList.prototype.select = function (index) {
        _WIL_select.call(this, index);
        if (this._detailWindow) {
            this._detailWindow.setItem(this.item());
        }
    };

    // Forçar repintura periódica para a animação de pulso
    const _WIL_update = Window_ItemList.prototype.update;
    Window_ItemList.prototype.update = function () {
        _WIL_update.call(this);
        if (ANIMATE_PULSE && Graphics.frameCount % 3 === 0 && this.active) {
            this.redrawCurrentItem();
        }
    };

    Window_ItemList.prototype.redrawCurrentItem = function () {
        const idx = this.index();
        if (idx >= 0) this.redrawItem(idx);
    };

    // Desabilita o drawAllItems nativo e usa o card personalizado
    Window_ItemList.prototype.drawItem = function (index) {
        const item = this.itemAt(index);
        if (!item) return;
        this._drawCard(item, this.itemRect(index), index === this.index());
    };

    Window_ItemList.prototype._drawCard = function (item, rect, selected) {
        const PAD   = 5;
        const x     = rect.x + PAD;
        const y     = rect.y + PAD;
        const w     = rect.width  - PAD * 2;
        const h     = rect.height - PAD * 2;
        const rarity = itemRarity(item);

        // --- Fundo do card ---
        this.contents.fillRect(x, y, w, h, 'rgba(10,10,20,0.55)');

        // --- Barra de raridade (esquerda) ---
        this.contents.fillRect(x, y, 3, h, rarity.color);

        // --- Seleção: pulso ---
        if (selected && ANIMATE_PULSE) {
            const alpha = 0.10 + Math.abs(Math.sin(Graphics.frameCount * 0.08)) * 0.10;
            this.contents.fillRect(x, y, w, h, `rgba(255,255,255,${alpha.toFixed(3)})`);
            // Borda inferior de destaque
            this.contents.fillRect(x, y + h - 2, w, 2, ACCENT);
        } else if (selected) {
            this.contents.fillRect(x, y, w, h, 'rgba(255,255,255,0.10)');
            this.contents.fillRect(x, y + h - 2, w, 2, ACCENT);
        }

        // --- Ícone grande ---
        const ICON_SIZE = 52;
        const iconX = x + (w - ICON_SIZE) / 2;
        const iconY = y + 6;
        drawScaledIcon(this.contents, item.iconIndex, iconX, iconY, ICON_SIZE);

        // --- Nome do item ---
        this.resetTextColor();
        this.contents.fontSize = 15;
        this.drawText(item.name, x + 3, y + ICON_SIZE + 10, w - 6, 'center');
        this.contents.fontSize = $gameSystem.mainFontSize();

        // --- Badge de quantidade (canto superior direito) ---
        // Usa canvas direto para controlar baseline exata e evitar overflow do lineHeight
        const qty    = $gameParty.numItems(item);
        const badgeW = 36;
        const badgeH = 20;
        const bx     = x + w - badgeW - 2;
        const by     = y + 2;
        this.contents.fillRect(bx, by, badgeW, badgeH, 'rgba(0,0,0,0.70)');
        // Linha superior colorida pelo sistema de raridade
        this.contents.fillRect(bx, by, badgeW, 2, itemRarity(item).color);
        const ctx = this.contents._context;
        ctx.save();
        ctx.font         = 'bold 13px ' + $gameSystem.numberFontFace();
        ctx.fillStyle    = ACCENT;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×' + qty, bx + badgeW / 2, by + badgeH / 2 + 1);
        ctx.restore();
    };

    // =========================================================================
    //  Window_ItemDetail — painel lateral com descrição + efeitos
    // =========================================================================

    class Window_ItemDetail extends Window_Base {

        initialize(rect) {
            super.initialize(rect);
            this._item = null;
        }

        setItem(item) {
            if (this._item !== item) {
                this._item = item;
                this.refresh();
            }
        }

        refresh() {
            this.contents.clear();
            if (!this._item) { this._drawEmpty(); return; }
            this._draw(this._item);
        }

        // -----------------------------------------------------------------
        //  Estado vazio
        // -----------------------------------------------------------------

        _drawEmpty() {
            const W = this.contents.width;
            const H = this.contents.height;
            this.changeTextColor('rgba(255,255,255,0.25)');
            this.contents.fontSize = 16;
            this.drawText('Selecione um item', 0, H / 2 - 10, W, 'center');
            this.contents.fontSize = $gameSystem.mainFontSize();
            this.resetTextColor();
        }

        // -----------------------------------------------------------------
        //  Layout principal
        // -----------------------------------------------------------------

        _draw(item) {
            const W      = this.contents.width;
            const rarity = itemRarity(item);
            let   y      = 0;

            // ---- Cabeçalho ----
            y = this._drawHeader(item, rarity, W, y);

            // ---- Descrição ----
            y = this._drawSection('Descrição', y, W);
            y = this._drawDescription(item, y, W);

            // ---- Atributos de Equipamento (só para armas e armaduras) ----
            const isEquip = (DataManager.isWeapon(item) || DataManager.isArmor(item));
            if (isEquip) {
                y = this._drawEquipStats(item, y, W);
            }

            // ---- Efeitos ----
            y = this._drawSection('Efeitos', y, W);
            y = this._drawEffects(item, y, W);

            // ---- Rodapé (stats básicos) ----
            this._drawFooter(item, y, W);
        }

        // -----------------------------------------------------------------
        //  Cabeçalho: ícone + nome + badge de raridade
        // -----------------------------------------------------------------

        _drawHeader(item, rarity, W, y) {
            // Fundo do bloco cabeçalho
            this.contents.fillRect(0, y, W, 136, 'rgba(0,0,0,0.30)');

            // Ícone grande centralizado
            const ICON_SIZE = 80;
            const iconX = Math.floor((W - ICON_SIZE) / 2);
            drawScaledIcon(this.contents, item.iconIndex, iconX, y + 8, ICON_SIZE);

            // Badge de raridade — apenas texto colorido + sublinha fina
            // (sem fillRect de fundo que causava o artefato "—LABEL—")
            const BADGE_Y = y + 94;
            const ctx     = this.contents._context;
            const label   = rarity.label.toUpperCase();

            this.contents.fontSize = 12;
            const labelW  = this.textWidth(label);
            const labelX  = Math.floor((W - labelW) / 2);

            // Texto do badge via canvas direto para controle exato de baseline
            ctx.save();
            ctx.font         = this.contents._makeFontNameText();
            ctx.fillStyle    = rarity.color;
            ctx.globalAlpha  = 0.90;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(label, W / 2, BADGE_Y);
            ctx.restore();

            // Linha fina abaixo do label (sublinha de cor da raridade)
            const lineY = BADGE_Y + 14;
            this.contents.fillRect(labelX - 6, lineY, labelW + 12, 1, rarity.color + 'aa');

            this.contents.fontSize = $gameSystem.mainFontSize();

            // Nome do item
            y += 105;
            this.contents.fontSize = 20;
            this.changeTextColor('#f0e6c8');
            this.drawText(item.name, 0, y, W, 'center');
            this.resetTextColor();
            this.contents.fontSize = $gameSystem.mainFontSize();
            y += 32;

            this._divider(y, W);
            return y + 12;
        }

        // -----------------------------------------------------------------
        //  Título de seção
        // -----------------------------------------------------------------

        _drawSection(title, y, W) {
            this.changeTextColor(ACCENT);
            this.contents.fontSize = 14;
            this.drawText(title.toUpperCase(), 10, y, W - 20);
            this.resetTextColor();
            this.contents.fontSize = $gameSystem.mainFontSize();
            return y + 24;
        }

        // -----------------------------------------------------------------
        //  Descrição do item  (com quebra de linha automática)
        // -----------------------------------------------------------------

        _drawDescription(item, y, W) {
            const LINE_H = 22;
            const MARGIN = 12;
            const maxW   = W - MARGIN * 2;
            const desc   = (item.description || '').trim();

            if (!desc) {
                this.changeTextColor('rgba(255,255,255,0.35)');
                this.contents.fontSize = 15;
                this.drawText('Sem descrição.', MARGIN, y, maxW);
                this.contents.fontSize = $gameSystem.mainFontSize();
                this.resetTextColor();
                y += LINE_H;
            } else {
                this.contents.fontSize = 15;
                this.resetTextColor();
                const lines = this._wrapText(desc, maxW);
                for (const line of lines) {
                    this.drawText(line, MARGIN, y, maxW);
                    y += LINE_H;
                }
                y += 4;
                this.contents.fontSize = $gameSystem.mainFontSize();
            }

            this._divider(y, W);
            return y + 12;
        }

        // -----------------------------------------------------------------
        //  Word-wrap: divide o texto em linhas que cabem dentro de maxWidth.
        //  Respeita quebras manuais (\n) e mede cada palavra com textWidth().
        // -----------------------------------------------------------------

        _wrapText(text, maxWidth) {
            const LINE_H_FONT = 15;
            // Garante que a fonte está ajustada antes de medir
            this.contents.fontSize = LINE_H_FONT;

            const paragraphs = text.split('\n');
            const result     = [];

            for (const para of paragraphs) {
                if (para.trim() === '') { result.push(''); continue; }

                const words   = para.split(' ');
                let   current = '';

                for (const word of words) {
                    const candidate = current ? current + ' ' + word : word;
                    if (this.textWidth(candidate) <= maxWidth) {
                        current = candidate;
                    } else {
                        if (current) result.push(current);
                        // Se a palavra sozinha já ultrapassa, ela entra sozinha mesmo
                        current = word;
                    }
                }
                if (current) result.push(current);
            }

            return result;
        }

        // -----------------------------------------------------------------
        //  Atributos de equipamento (params[8]: MHP MMP ATK DEF MAT MDF AGI LUK)
        // -----------------------------------------------------------------

        _drawEquipStats(item, y, W) {
            // Nomes curtos para economizar espaço no painel lateral
            const PARAM_NAMES = [
                'Vida Máx.', 'Mana Máx.', 'Ataque', 'Defesa',
                'Mag. Atk.', 'Mag. Def.', 'Agilidade', 'Sorte'
            ];
            // Ícones representativos por parâmetro (iconSet padrão RMMZ)
            const PARAM_ICONS = [ 87, 79, 76, 81, 79, 79, 81, 84 ];

            const params = item.params || [];
            const nonZero = params
                .map((val, i) => ({ val, i }))
                .filter(p => p.val !== 0);

            if (nonZero.length === 0) {
                this.changeTextColor('rgba(255,255,255,0.35)');
                this.contents.fontSize = 15;
                this.drawText('Nenhum bônus de atributo.', 12, y, W - 24);
                this.contents.fontSize = $gameSystem.mainFontSize();
                this.resetTextColor();
                y += 22;
                this._divider(y, W);
                return y + 12;
            }

            // Layout em duas colunas para aproveitar a largura do painel
            const COL_W  = Math.floor(W / 2);
            const LINE_H = 38;
            const MARGIN = 12;
            let col = 0;
            let rowY = y;

            for (const { val, i } of nonZero) {
                const positive  = val > 0;
                const sign      = positive ? '+' : '';
                const color     = positive ? '#4ade80' : '#f87171';
                const colX      = col === 0 ? 0 : COL_W;

                // Ícone do parâmetro
                this.drawIcon(PARAM_ICONS[i], colX + MARGIN, rowY - 1);

                const iconRight = colX + MARGIN + ImageManager.iconWidth + 6;

                // Nome do param
                this.changeTextColor('rgba(255,255,255,0.55)');
                this.contents.fontSize = 14;
                this.drawText(PARAM_NAMES[i], iconRight, rowY, COL_W - iconRight + colX - 4);

                // Valor com sinal (alinhado à direita da coluna)
                this.changeTextColor(color);
                this.contents.fontSize = 15;
                this.drawText(sign + val, colX, rowY, COL_W - MARGIN, 'right');

                this.resetTextColor();
                this.contents.fontSize = $gameSystem.mainFontSize();

                col++;
                if (col >= 2) { col = 0; rowY += LINE_H; }
            }

            // Fecha a última linha se terminou em col=1 (número ímpar de stats)
            if (col !== 0) rowY += LINE_H;

            y = rowY + 4;
            this._divider(y, W);
            return y + 12;
        }

        // -----------------------------------------------------------------
        //  Efeitos do item
        // -----------------------------------------------------------------

        _drawEffects(item, y, W) {
            const lines = this._parseEffects(item);

            if (lines.length === 0) {
                this.changeTextColor('rgba(255,255,255,0.35)');
                this.contents.fontSize = 14;
                this.drawText('Nenhum efeito.', 10, y, W - 20);
                this.contents.fontSize = $gameSystem.mainFontSize();
                this.resetTextColor();
                y += 22;
            } else {
                this.contents.fontSize = 15;
                for (const line of lines) {
                    y = this._drawEffectLine(line, y, W);
                }
                this.contents.fontSize = $gameSystem.mainFontSize();
            }

            this._divider(y, W);
            return y + 12;
        }

        _drawEffectLine(line, y, W) {
            let x = 10;

            // Bullet colorido ou ícone
            if (line.icon && line.icon > 0) {
                this.drawIcon(line.icon, x, y - 1);
                x += ImageManager.iconWidth + 6;
            } else {
                // quadradinho de cor
                this.contents.fillRect(x, y + 9, 7, 7, line.color || '#cccccc');
                x += 16;
            }

            this.changeTextColor(line.color || '#e0e0e0');
            this.drawText(line.text, x, y, W - x - 6);
            this.resetTextColor();
            return y + 24;
        }

        // -----------------------------------------------------------------
        //  Rodapé: quantidade e valor
        // -----------------------------------------------------------------

        _drawFooter(item, y, W) {
            const qty = $gameParty.numItems(item);
            this._statRow('Em posse:',  '×' + qty,                              y,      W);
            if (item.price > 0) {
                this._statRow('Valor:', item.price + ' ' + TextManager.currencyUnit, y + 26, W);
            }
        }

        _statRow(label, value, y, W) {
            const MARGIN    = 12;
            const labelW    = Math.floor(W * 0.50);
            const valueX    = MARGIN + labelW;
            const valueW    = W - valueX - MARGIN;
            this.contents.fontSize = 15;
            this.changeTextColor('rgba(255,255,255,0.50)');
            this.drawText(label, MARGIN, y, labelW);
            this.changeTextColor('#f0e6c8');
            this.drawText(value, valueX, y, valueW, 'right');
            this.resetTextColor();
            this.contents.fontSize = $gameSystem.mainFontSize();
        }

        // -----------------------------------------------------------------
        //  Separador horizontal
        // -----------------------------------------------------------------

        _divider(y, W) {
            this.contents.fillRect(10, y + 2, W - 20, 1, 'rgba(255,255,255,0.12)');
        }

        // -----------------------------------------------------------------
        //  Parser de efeitos → array de { icon, color, text }
        // -----------------------------------------------------------------

        _parseEffects(item) {
            const result = [];
            if (!item.effects || item.effects.length === 0) return result;

            for (const eff of item.effects) {
                const line = this._interpretEffect(eff);
                if (line) result.push(line);
            }
            return result;
        }

        _interpretEffect(eff) {
            const code = eff.code;

            // ── Recuperação de HP ──────────────────────────────────────────
            if (code === Game_Action.EFFECT_RECOVER_HP) {
                const parts = [];
                if (eff.value1 !== 0) parts.push(Math.round(eff.value1 * 100) + '% HP');
                if (eff.value2 !== 0) parts.push((eff.value2 > 0 ? '+' : '') + eff.value2 + ' HP');
                if (parts.length === 0) return null;
                const pos = eff.value1 > 0 || eff.value2 > 0;
                return {
                    icon:  84,
                    color: pos ? '#34d399' : '#f87171',
                    text:  (pos ? 'Recupera ' : 'Drena ') + parts.join(' + ')
                };
            }

            // ── Recuperação de MP ──────────────────────────────────────────
            if (code === Game_Action.EFFECT_RECOVER_MP) {
                const parts = [];
                if (eff.value1 !== 0) parts.push(Math.round(eff.value1 * 100) + '% MP');
                if (eff.value2 !== 0) parts.push((eff.value2 > 0 ? '+' : '') + eff.value2 + ' MP');
                if (parts.length === 0) return null;
                const pos = eff.value1 > 0 || eff.value2 > 0;
                return {
                    icon:  79,
                    color: pos ? '#60a5fa' : '#a78bfa',
                    text:  (pos ? 'Recupera ' : 'Drena ') + parts.join(' + ')
                };
            }

            // ── Ganho de TP ────────────────────────────────────────────────
            if (code === Game_Action.EFFECT_GAIN_TP) {
                return { icon: 127, color: '#fbbf24', text: 'Ganha ' + eff.value1 + ' TP' };
            }

            // ── Aplicar estado ─────────────────────────────────────────────
            if (code === Game_Action.EFFECT_ADD_STATE) {
                const state   = $dataStates[eff.dataId];
                if (!state) return null;
                const nome    = state.name || ('Estado ' + eff.dataId);
                const chance  = eff.value1 < 1 ? (' (' + Math.round(eff.value1 * 100) + '%)') : '';
                // Estado 1 = KO (morte)
                if (eff.dataId === 1) {
                    return { icon: 0, color: '#ef4444', text: 'Causa KO' + chance };
                }
                return {
                    icon:  state.iconIndex || 0,
                    color: '#fb923c',
                    text:  'Aplica: ' + nome + chance
                };
            }

            // ── Remover estado ─────────────────────────────────────────────
            if (code === Game_Action.EFFECT_REMOVE_STATE) {
                const state = $dataStates[eff.dataId];
                if (!state) return null;
                const nome  = state.name || ('Estado ' + eff.dataId);
                return {
                    icon:  state.iconIndex || 0,
                    color: '#2dd4bf',
                    text:  'Cura: ' + nome
                };
            }

            // ── Buff de atributo ───────────────────────────────────────────
            if (code === Game_Action.EFFECT_ADD_BUFF) {
                const param = TextManager.param(eff.dataId);
                return {
                    icon:  0,
                    color: '#4ade80',
                    text:  'Aumenta ' + param + ' (' + eff.value1 + ' turnos)'
                };
            }

            // ── Debuff de atributo ─────────────────────────────────────────
            if (code === Game_Action.EFFECT_ADD_DEBUFF) {
                const param = TextManager.param(eff.dataId);
                return {
                    icon:  0,
                    color: '#f87171',
                    text:  'Reduz ' + param + ' (' + eff.value1 + ' turnos)'
                };
            }

            // ── Remover buff ───────────────────────────────────────────────
            if (code === Game_Action.EFFECT_REMOVE_BUFF) {
                const param = TextManager.param(eff.dataId);
                return { icon: 0, color: '#94a3b8', text: 'Remove buff de ' + param };
            }

            // ── Remover debuff ─────────────────────────────────────────────
            if (code === Game_Action.EFFECT_REMOVE_DEBUFF) {
                const param = TextManager.param(eff.dataId);
                return { icon: 0, color: '#94a3b8', text: 'Remove debuff de ' + param };
            }

            // ── Crescimento permanente (Grow) ──────────────────────────────
            if (code === Game_Action.EFFECT_GROW) {
                const param = TextManager.param(eff.dataId);
                return {
                    icon:  0,
                    color: '#c084fc',
                    text:  'Aumenta permanentemente ' + param
                };
            }

            // ── Aprender habilidade ────────────────────────────────────────
            if (code === Game_Action.EFFECT_LEARN_SKILL) {
                const skill = $dataSkills[eff.dataId];
                if (!skill) return null;
                return {
                    icon:  skill.iconIndex || 0,
                    color: '#f59e0b',
                    text:  'Ensina: ' + skill.name
                };
            }

            // ── Evento comum ───────────────────────────────────────────────
            if (code === Game_Action.EFFECT_COMMON_EVENT) {
                return { icon: 5, color: '#94a3b8', text: 'Ativa evento especial' };
            }

            return null;
        }

    } // class Window_ItemDetail

    window.Window_ItemDetail = Window_ItemDetail;

})();