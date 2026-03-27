
/*:
 * @target MZ
 * @plugindesc Ajusta o posicionamento dos personagens na batalha para aspect ratio 16:9
 * @author Leandro Nunes
 * @url www.1337games.com.br
 * @version 1.0.0
 *
 * @help BattlePosition16x9.js
 *
 * Este plugin ajusta o posicionamento dos aliados na tela de batalha
 * para aproveitar melhor o espaço em telas widescreen 16:9.
 *
 * Compatível apenas com Side-View Battle.
 *
 * ============================================================================
 * Termos de Uso
 * ============================================================================
 * Livre para uso em projetos comerciais e não-comerciais.
 * Crédito apreciado mas não obrigatório.
 *
 * ============================================================================
 * Parâmetros
 * ============================================================================
 *
 * @param ActorPositions
 * @text Posições dos Aliados
 * @desc Configurações de posicionamento dos aliados
 *
 * @param ActorX
 * @text Posição X Base
 * @parent ActorPositions
 * @desc Posição X inicial dos aliados (em pixels)
 * @type number
 * @min 0
 * @max 2000
 * @default 600
 *
 * @param ActorY
 * @text Posição Y Base
 * @parent ActorPositions
 * @desc Posição Y inicial dos aliados (em pixels)
 * @type number
 * @min 0
 * @max 1000
 * @default 300
 *
 * @param SpacingX
 * @text Espaçamento Horizontal
 * @parent ActorPositions
 * @desc Distância horizontal entre cada aliado (em pixels)
 * @type number
 * @min -500
 * @max 500
 * @default 120
 *
 * @param SpacingY
 * @text Espaçamento Vertical
 * @parent ActorPositions
 * @desc Distância vertical entre cada aliado (em pixels)
 * @type number
 * @min -500
 * @max 500
 * @default 48
 *
 * @param EnemyPositions
 * @text Posições dos Inimigos
 * @desc Configurações de posicionamento dos inimigos
 *
 * @param EnemyOffsetX
 * @text Ajuste X dos Inimigos
 * @parent EnemyPositions
 * @desc Ajuste adicional na posição X dos inimigos
 * @type number
 * @min -500
 * @max 500
 * @default 0
 *
 * @param EnemyOffsetY
 * @text Ajuste Y dos Inimigos
 * @parent EnemyPositions
 * @desc Ajuste adicional na posição Y dos inimigos
 * @type number
 * @min -500
 * @max 500
 * @default 0
 *
 * @param EnemyScaleX
 * @text Escala X dos Inimigos
 * @parent EnemyPositions
 * @desc Multiplica a posição X dos inimigos (para espalhar ou juntar)
 * @type number
 * @decimals 2
 * @min 0.5
 * @max 2.0
 * @default 1.0
 */

(() => {
    'use strict';

    const pluginName = 'BattlePosition16x9';
    const parameters = PluginManager.parameters(pluginName);
    const actorBaseX = Number(parameters['ActorX']) || 600;
    const actorBaseY = Number(parameters['ActorY']) || 300;
    const actorSpacingX = Number(parameters['SpacingX']) || 120;
    const actorSpacingY = Number(parameters['SpacingY']) || 48;
    const enemyOffsetX = Number(parameters['EnemyOffsetX']) || 0;
    const enemyOffsetY = Number(parameters['EnemyOffsetY']) || 0;
    const enemyScaleX = Number(parameters['EnemyScaleX']) || 1.0;

    const _Sprite_Actor_setActorHome = Sprite_Actor.prototype.setActorHome;
    Sprite_Actor.prototype.setActorHome = function(index) {
        _Sprite_Actor_setActorHome.call(this, index);
        this._homeX = actorBaseX + (index * actorSpacingX);
        this._homeY = actorBaseY + (index * actorSpacingY);
    };

    const _Sprite_Actor_updatePosition = Sprite_Actor.prototype.updatePosition;
    Sprite_Actor.prototype.updatePosition = function() {
        if (this._actor) {
            const index = this._actor.index();
            const targetX = actorBaseX + (index * actorSpacingX);
            const targetY = actorBaseY + (index * actorSpacingY);
            if (this._homeX !== targetX || this._homeY !== targetY) {
                this._homeX = targetX;
                this._homeY = targetY;
            }
        }

        _Sprite_Actor_updatePosition.call(this);
    };

    const _Game_Enemy_screenX = Game_Enemy.prototype.screenX;
    Game_Enemy.prototype.screenX = function() {
        const originalX = _Game_Enemy_screenX.call(this);
        return (originalX * enemyScaleX) + enemyOffsetX;
    };

    const _Game_Enemy_screenY = Game_Enemy.prototype.screenY;
    Game_Enemy.prototype.screenY = function() {
        const originalY = _Game_Enemy_screenY.call(this);
        return originalY + enemyOffsetY;
    };

})();


