
/*:
 * @target MZ
 * @plugindesc [v9.0] Exibe a ordem de turnos numa janela (TPB).
 * @author Leandro Nunes
 * @url www.1337games.com.br
 *
 * @param --- Janela ---
 *
 * @param windowX
 * @text Posição X da Janela
 * @parent --- Janela ---
 * @type number
 * @min -9999
 * @default -1
 * @desc Posição X. Use -1 para centralizar automaticamente.
 *
 * @param windowY
 * @text Posição Y da Janela
 * @parent --- Janela ---
 * @type number
 * @min 0
 * @default 6
 * @desc Posição Y (distância do topo da tela).
 *
 * @param windowPadding
 * @text Padding Interno da Janela (px)
 * @parent --- Janela ---
 * @type number
 * @min 0
 * @max 32
 * @default 10
 * @desc Espaço entre a borda da janela e os ícones.
 *
 * @param windowOpacity
 * @text Opacidade da Janela (0-255)
 * @parent --- Janela ---
 * @type number
 * @min 0
 * @max 255
 * @default 200
 *
 * @param direction
 * @text Direção dos Ícones
 * @parent --- Janela ---
 * @type select
 * @option Horizontal
 * @value horizontal
 * @option Vertical
 * @value vertical
 * @default horizontal
 * @desc Exibe os ícones em linha (horizontal) ou em coluna (vertical).
 *
 * @param --- Layout ---
 *
 * @param iconSize
 * @text Tamanho do Ícone (px)
 * @parent --- Layout ---
 * @type number
 * @min 32
 * @max 128
 * @default 52
 *
 * @param spacing
 * @text Espaçamento entre Ícones (px)
 * @parent --- Layout ---
 * @type number
 * @min 0
 * @max 32
 * @default 6
 *
 * @param barHeight
 * @text Altura da Barra de Carga (px)
 * @parent --- Layout ---
 * @type number
 * @min 2
 * @max 12
 * @default 5
 *
 * @param borderSize
 * @text Espessura da Borda do Ícone (px)
 * @parent --- Layout ---
 * @type number
 * @min 0
 * @max 8
 * @default 2
 *
 * @param --- Cores ---
 *
 * @param actorBorderColor
 * @text Borda (Aliados)
 * @parent --- Cores ---
 * @type string
 * @default #55aaff
 *
 * @param enemyBorderColor
 * @text Borda (Inimigos)
 * @parent --- Cores ---
 * @type string
 * @default #ff5555
 *
 * @param actorBarColor1
 * @text Barra Aliado (início)
 * @parent --- Cores ---
 * @type string
 * @default #2266ff
 *
 * @param actorBarColor2
 * @text Barra Aliado (fim)
 * @parent --- Cores ---
 * @type string
 * @default #66ccff
 *
 * @param enemyBarColor1
 * @text Barra Inimigo (início)
 * @parent --- Cores ---
 * @type string
 * @default #cc2222
 *
 * @param enemyBarColor2
 * @text Barra Inimigo (fim)
 * @parent --- Cores ---
 * @type string
 * @default #ff8844
 *
 * @param readyGlowColor
 * @text Brilho (Pronto para Agir)
 * @parent --- Cores ---
 * @type string
 * @default #ffff44
 *
 * @param bgColor
 * @text Fundo do Ícone
 * @parent --- Cores ---
 * @type string
 * @default #111122
 *
 * @param --- Comportamento ---
 *
 * @param sortMode
 * @text Ordenação
 * @parent --- Comportamento ---
 * @type select
 * @option Mais Rápido Primeiro
 * @value fastest
 * @option Aliados Primeiro
 * @value actorsFirst
 * @option Inimigos Primeiro
 * @value enemiesFirst
 * @default fastest
 *
 * @param showDeadBattlers
 * @text Mostrar Mortos
 * @parent --- Comportamento ---
 * @type boolean
 * @default false
 *
 * @param animateSlide
 * @text Animar Deslizamento
 * @parent --- Comportamento ---
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * TOD - Turn Order Display v9.0
 * ============================================================================
 * Exibe a fila de turnos dentro de uma janela durante batalhas TPB.
 *
 * - Direção configurável: Horizontal (linha) ou Vertical (coluna).
 *
 * - Posição X/Y configurável. X = -1 centraliza automaticamente.
 * - Usa o windowskin padrão do jogo como fundo da janela.
 * - Aliados: face image. Inimigos: img/sv_enemies/ automaticamente.
 * - Barra de carga TPB em cada ícone.
 * - Ícone pulsa em amarelo quando pronto para agir.
 *
 * Nota para sobrescrever imagem de inimigo:
 *   <todIcon: NomeDoArquivo>
 * ============================================================================
 */

(() => {
    'use strict';

    const PLUGIN_NAME = 'TOD_TurnOrderDisplay';
    const params = PluginManager.parameters(PLUGIN_NAME);

    const P = {
        winX:       Number(params['windowX']           ?? 1055),
        winY:       Number(params['windowY']           || 6),
        winPad:     Number(params['windowPadding']     || 10),
        winOpacity: Number(params['windowOpacity']     ?? 200),
        size:       Number(params['iconSize']          || 70),
        spacing:    Number(params['spacing']           || 6),
        barH:       Number(params['barHeight']         || 7),
        border:     Number(params['borderSize']        || 2),
        aBorder:    String(params['actorBorderColor']  || '#55aaff'),
        eBorder:    String(params['enemyBorderColor']  || '#ff5555'),
        aBar1:      String(params['actorBarColor1']    || '#2266ff'),
        aBar2:      String(params['actorBarColor2']    || '#66ccff'),
        eBar1:      String(params['enemyBarColor1']    || '#cc2222'),
        eBar2:      String(params['enemyBarColor2']    || '#ff8844'),
        glow:       String(params['readyGlowColor']    || '#ffff44'),
        bg:         String(params['bgColor']           || '#111122'),
        sort:       String(params['sortMode']          || 'fastest'),
        showDead:   params['showDeadBattlers'] === 'true',
        slide:      params['animateSlide']    !== 'false',
        direction:  String(params['direction'] || 'vertical'),
    };
    const slotHeight = () => P.size + 2 + P.barH;
    class Sprite_TOD_Battler extends Sprite {

        constructor(battler) {
            super();
            this._battler    = battler;
            this._targetX    = 0;
            this._glowPhase  = 0;
            this._lastReady  = false;
            this._lastRateI  = -1;
            this._imgReady   = false;

            this._setupBackground();
            this._setupImageSprite();
            this._setupBar();
            this._requestBitmap();
        }

        get battler() { return this._battler; }
        _setupBackground() {
            this._bgBmp    = new Bitmap(P.size, P.size);
            this._bgSprite = new Sprite(this._bgBmp);
            this.addChild(this._bgSprite);
            this._drawBg(false);
        }

        _drawBg(ready) {
            const ctx  = this._bgBmp.context;
            const S    = P.size;
            const B    = P.border;
            const innW = S - B * 2;
            const R    = 6;
            this._bgBmp.clear();

            ctx.fillStyle = ready ? P.glow
                : (this._battler.isActor() ? P.aBorder : P.eBorder);
            ctx.beginPath();
            this._rrect(ctx, 0, 0, S, S, R);
            ctx.fill();

            ctx.fillStyle = P.bg;
            ctx.beginPath();
            this._rrect(ctx, B, B, innW, innW, Math.max(0, R - B));
            ctx.fill();

            this._bgBmp._baseTexture.update();
        }
        _setupImageSprite() {
            this._imgSprite = new Sprite();
            this.addChild(this._imgSprite);
        }

        _requestBitmap() {
            const battler = this._battler;
            if (battler.isActor()) {
                const name = battler.faceName();
                if (!name) return;
                this._pendingBitmap = ImageManager.loadFace(name);
                this._pendingType   = 'face';
                this._pendingIndex  = battler.faceIndex();
            } else {
                const enemy = battler.enemy();
                const match = enemy.note.match(/<todIcon:\s*(.+)>/i);
                const name  = match ? match[1].trim() : battler.battlerName();
                console.log('[TOD] Enemy:', battler.name(), '| battlerName:', name);
                if (!name) return;
                this._pendingBitmap = ImageManager.loadSvEnemy(name);
                this._pendingType   = 'svEnemy';
            }
        }

        _tryApplyImage() {
            if (this._imgReady)        return;
            if (!this._pendingBitmap)  return;
            if (!this._pendingBitmap.isReady()) return;

            const bmp  = this._pendingBitmap;
            const S    = P.size;
            const B    = P.border;
            const innW = S - B * 2;

            if (this._pendingType === 'face') {
                this._applyFace(bmp, innW, B);
            } else {
                console.log('[TOD] _applySvEnemy:', this._battler.name(), '| w:', bmp.width, 'h:', bmp.height);
                this._applySvEnemy(bmp, innW, B);
            }
            this._imgReady = true;
        }

        _applyFace(bmp, innW, B) {
            const fW = ImageManager.faceWidth;
            const fH = ImageManager.faceHeight;
            const fi = this._pendingIndex;
            const sx = (fi % 4) * fW;
            const sy = Math.floor(fi / 4) * fH;

            const scale = Math.max(innW / fW, innW / fH);
            const visW  = innW / scale;
            const visH  = innW / scale;
            const cropX = sx + (fW - visW) / 2;
            const cropY = sy + (fH - visH) / 2;

            const sp = this._imgSprite;
            sp.bitmap = bmp;
            sp.setFrame(cropX, cropY, visW, visH);
            sp.scale.set(scale);
            sp.x = B;
            sp.y = B;
        }

        _applySvEnemy(bmp, innW, B) {
            const W = bmp.width;
            const H = bmp.height;
            if (W === 0 || H === 0) return;

            const scale = Math.min(innW / W, innW / H);
            const ox    = B + (innW - W * scale) / 2;
            const oy    = B + (innW - H * scale) / 2;

            const sp = this._imgSprite;
            sp.bitmap = bmp;
            sp.setFrame(0, 0, W, H);
            sp.scale.set(scale);
            sp.x = ox;
            sp.y = oy;
        }
        _setupBar() {
            this._barBmp    = new Bitmap(P.size, P.barH);
            this._barSprite = new Sprite(this._barBmp);
            this._barSprite.y = P.size + 2;
            this.addChild(this._barSprite);
            this._drawBar(0);
        }

        _drawBar(rate) {
            const ctx = this._barBmp.context;
            const S   = P.size;
            this._barBmp.clear();

            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, S, P.barH);

            if (rate > 0) {
                const actor = this._battler.isActor();
                const g = ctx.createLinearGradient(0, 0, S, 0);
                g.addColorStop(0, actor ? P.aBar1 : P.eBar1);
                g.addColorStop(1, actor ? P.aBar2 : P.eBar2);
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, Math.floor(S * rate), P.barH);
            }

            this._barBmp._baseTexture.update();
        }
        _rrect(ctx, x, y, w, h, r) {
            r = Math.min(r, w / 2, h / 2);
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.arcTo(x + w, y,     x + w, y + r,     r);
            ctx.lineTo(x + w, y + h - r);
            ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
            ctx.lineTo(x + r,  y + h);
            ctx.arcTo(x,     y + h, x,     y + h - r, r);
            ctx.lineTo(x,     y + r);
            ctx.arcTo(x,     y,     x + r, y,         r);
            ctx.closePath();
        }

        _chargeRate() {
            const b = this._battler;
            if (b.isDead()) return 0;
            if (b._tpbState === 'charged' || b._tpbState === 'acting') return 1;
            return Math.min(1, b._tpbChargeTime || 0);
        }

        _isReady() {
            return this._battler._tpbState === 'charged' ||
                   this._battler._tpbState === 'acting';
        }
        update() {
            super.update();

            this._tryApplyImage();
            if (P.slide) {
                const dx = this._targetX - this.x;
                this.x += Math.abs(dx) > 0.5 ? dx * 0.2 : dx;
            } else {
                this.x = this._targetX;
            }
            this._glowPhase += 0.08;
            const ready = this._isReady();
            if (ready !== this._lastReady) {
                this._lastReady = ready;
                this._drawBg(ready);
            }
            if (ready) {
                this._bgSprite.opacity = Math.floor(180 + 75 * (0.5 + 0.5 * Math.sin(this._glowPhase)));
            } else {
                this._bgSprite.opacity = 255;
            }
            const rI = Math.floor(this._chargeRate() * P.size);
            if (rI !== this._lastRateI) {
                this._lastRateI = rI;
                this._drawBar(rI / P.size);
            }

            this.opacity = (this._battler.isDead() && P.showDead) ? 130 : 255;
        }
    }
    class Window_TOD extends Window_Base {
        constructor() {
            super(new Rectangle(0, 0, 64, 64));
            this.opacity        = P.winOpacity;
            this.backOpacity    = P.winOpacity;
            this.openness       = 255;
            this._lastCount     = -1;
        }
        static computeSize(count) {
            const PAD     = P.winPad;
            const step    = P.size + P.spacing;
            const slotH   = slotHeight();
            const stepV   = slotH + P.spacing;
            const isHoriz = P.direction !== 'vertical';
            let innerW, innerH;
            if (isHoriz) {
                innerW = count > 0 ? count * step - P.spacing : P.size;
                innerH = slotH;
            } else {
                const MAX_PER_COL = 4;
                const cols   = count > MAX_PER_COL ? 2 : 1;
                const rows   = Math.min(count, MAX_PER_COL);
                innerW = cols > 1 ? cols * step - P.spacing : P.size;
                innerH = rows > 0 ? rows * stepV - P.spacing : slotH;
            }
            const w = innerW + PAD * 2;
            const h = innerH + PAD * 2;
            let x;
            if (P.winX < 0) {
                x = Math.floor((Graphics.width - w) / 2);
            } else {
                x = count >= 5 ? 980 : 1055;
            }
            const y = P.winY;
            return { x, y, w, h };
        }
        resizeForCount(count) {
            if (count === this._lastCount) return;
            this._lastCount = count;
            const { x, y, w, h } = Window_TOD.computeSize(count);
            this.x      = x;
            this.y      = y;
            this.width  = w;
            this.height = h;
            this._refreshAllParts();
        }
        refresh() {}
    }
    class Sprite_TOD_Container extends Sprite {
        constructor(window) {
            super();
            this._window = window;
            this._slots  = [];
            this._tick   = 0;
        }

        update() {
            super.update();
            if (++this._tick % 4 === 0) this._syncBattlers();
            this._reposition();
            for (const s of this._slots) s.update();
        }

        _battlerList() {
            if (!$gameParty || !$gameTroop) return [];
            return P.showDead
                ? [...$gameParty.members(),      ...$gameTroop.members()]
                : [...$gameParty.aliveMembers(), ...$gameTroop.aliveMembers()];
        }

        _syncBattlers() {
            const list = this._battlerList();
            for (let i = this._slots.length - 1; i >= 0; i--) {
                if (!list.includes(this._slots[i].battler)) {
                    this.removeChild(this._slots[i]);
                    this._slots.splice(i, 1);
                }
            }
            for (const b of list) {
                if (!this._slots.find(s => s.battler === b)) {
                    const slot = new Sprite_TOD_Battler(b);
                    this._slots.push(slot);
                    this.addChild(slot);
                }
            }
        }

        _sorted() {
            const slots = [...this._slots];
            const rate  = s => s._chargeRate();
            switch (P.sort) {
                case 'actorsFirst':
                    return slots.sort((a, b) => {
                        const d = (a.battler.isActor()?0:1) - (b.battler.isActor()?0:1);
                        return d || rate(b) - rate(a);
                    });
                case 'enemiesFirst':
                    return slots.sort((a, b) => {
                        const d = (a.battler.isEnemy()?0:1) - (b.battler.isEnemy()?0:1);
                        return d || rate(b) - rate(a);
                    });
                default:
                    return slots.sort((a, b) => rate(b) - rate(a));
            }
        }

        _reposition() {
            const sorted  = this._sorted();
            const count   = sorted.length;
            const isHoriz = P.direction !== 'vertical';
            this._window.resizeForCount(count);
            this.x = this._window.x + P.winPad;
            this.y = this._window.y + P.winPad;
            const innerW      = this._window.width  - P.winPad * 2;
            const innerH      = this._window.height - P.winPad * 2;
            const step        = P.size + P.spacing;
            const stepV       = slotHeight() + P.spacing;
            const MAX_PER_COL = 4;

            if (isHoriz) {
                const totalW    = count > 0 ? count * step - P.spacing : P.size;
                const offsetX   = Math.floor((innerW - totalW) / 2);
                const offsetY   = Math.floor((innerH - slotHeight()) / 2);
                sorted.forEach((s, i) => {
                    s._targetX = offsetX + i * step;
                    s.y        = offsetY;
                });
            } else {
                const cols    = count > MAX_PER_COL ? 2 : 1;
                const rows    = Math.min(count, MAX_PER_COL);
                const totalW  = cols > 1 ? cols * step - P.spacing : P.size;
                const totalH  = rows > 0 ? rows * stepV - P.spacing : slotHeight();
                const offsetX = Math.floor((innerW - totalW) / 2);
                const offsetY = Math.floor((innerH - totalH) / 2);

                sorted.forEach((s, i) => {
                    const col  = Math.floor(i / MAX_PER_COL);
                    const row  = i % MAX_PER_COL;
                    s._targetX = offsetX + col * step;
                    s.y        = offsetY + row * stepV;
                });
            }
        }
    }
    const _createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _createAllWindows.call(this);
        this._todWindow = new Window_TOD();
        this.addChild(this._todWindow);

        this._todContainer = new Sprite_TOD_Container(this._todWindow);
        this.addChild(this._todContainer);
    };

})();


