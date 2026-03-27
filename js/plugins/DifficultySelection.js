/*:
 * @target MZ
 * @plugindesc Adds Normal, Hard, and Very Hard difficulty modes with stat modifiers
 * @author Leandro Nunes
 * @url www.1337games.com.br
 *
 * @param difficultyVariableId
 * @text ID da Variável de Dificuldade
 * @type variable
 * @default 1
 * @desc Variável do jogo que armazena a dificuldade (1 = Normal, 2 = Difícil, 3 = Muito Difícil)
 *
 * @help
 * ============================================================================
 * Difficulty Selection Plugin
 * ============================================================================
 * 
 * This plugin adds a difficulty selection screen at the start of a new game.
 * Players can choose between Normal, Hard, and Very Hard difficulty.
 * 
 * NORMAL MODE:
 * - Default game balance
 * 
 * HARD MODE:
 * - Enemy HP: 150%
 * - Enemy ATK/DEF/MAT/MDF: 130%
 * - Enemy AGI: 120%
 * - Healing effectiveness: 85%
 * - Escape success rate: 75%
 * 
 * VERY HARD MODE:
 * - Enemy HP: 200%
 * - Enemy ATK/DEF/MAT/MDF: 150%
 * - Enemy AGI: 140%
 * - Gold drops: 80%
 * - EXP gain: 85%
 * - Healing effectiveness: 70%
 * - Escape success rate: 50%
 * - Shop prices: 130%
 * 
 * Item drops remain unchanged on all difficulties.
 * The difficulty cannot be changed once selected.
 * 
 * ============================================================================
 */

(() => {
    'use strict';

    const pluginName = 'DifficultySelection';
    const parameters = PluginManager.parameters(pluginName);
    const difficultyVarId = Number(parameters['difficultyVariableId'] || 1);

    class Scene_DifficultySelect extends Scene_MenuBase {
        create() {
            super.create();
            this.createBackground();
            this.createWindowLayer();
            this.createTitleWindow();
            this.createDescriptionWindow();
            this.createCommandWindow();
        }

        createBackground() {
            this._backgroundSprite = new Sprite();
            this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
            this.addChild(this._backgroundSprite);
        }

        createTitleWindow() {
            const rect = this.titleWindowRect();
            this._titleWindow = new Window_Help(rect);
            this._titleWindow.setText('Selecione a Dificuldade');
            this.addWindow(this._titleWindow);
        }

        titleWindowRect() {
            const ww = Graphics.boxWidth;
            const wh = this.calcWindowHeight(1, false);
            const wx = 0;
            const wy = (Graphics.boxHeight - wh) / 2 - 200;
            return new Rectangle(wx, wy, ww, wh);
        }

        createDescriptionWindow() {
            const rect = this.descriptionWindowRect();
            this._descriptionWindow = new Window_Help(rect);
            this._descriptionWindow.setText('');
            this.addWindow(this._descriptionWindow);
        }

        descriptionWindowRect() {
            const ww = Graphics.boxWidth - 100;
            const wh = this.calcWindowHeight(4, false);
            const wx = 50;
            const wy = (Graphics.boxHeight - wh) / 2 + 200;
            return new Rectangle(wx, wy, ww, wh);
        }

        createCommandWindow() {
            const rect = this.commandWindowRect();
            this._commandWindow = new Window_DifficultyCommand(rect);
            this._commandWindow.setHandler('normal', this.onNormalSelected.bind(this));
            this._commandWindow.setHandler('hard', this.onHardSelected.bind(this));
            this._commandWindow.setHandler('veryhard', this.onVeryHardSelected.bind(this));
            this._commandWindow.setHelpWindow(this._descriptionWindow);
            this.addWindow(this._commandWindow);
        }

        commandWindowRect() {
            const ww = 600;
            const wh = this.calcWindowHeight(3, true);
            const wx = (Graphics.boxWidth - ww) / 2;
            const wy = (Graphics.boxHeight - wh) / 2 - 20;
            return new Rectangle(wx, wy, ww, wh);
        }

        onNormalSelected() {
            $gameVariables.setValue(difficultyVarId, 1);
            this.startGame();
        }

        onHardSelected() {
            $gameVariables.setValue(difficultyVarId, 2);
            this.startGame();
        }

        onVeryHardSelected() {
            $gameVariables.setValue(difficultyVarId, 3);
            this.startGame();
        }

        startGame() {
            this.fadeOutAll();
            SceneManager.goto(Scene_Map);
            $gamePlayer.reserveTransfer($dataSystem.startMapId,
                $dataSystem.startX, $dataSystem.startY);
            Graphics.frameCount = 0;
        }
    }

    class Window_DifficultyCommand extends Window_Command {
        makeCommandList() {
            this.addCommand('Normal', 'normal');
            this.addCommand('Heroica', 'hard');
            this.addCommand('Caótica', 'veryhard');
        }

        updateHelp() {
            const symbol = this.currentSymbol();
            let text = '';

            if (symbol === 'normal') {
                text = 'Dificuldade padrão. Recomendada a jogadores casuais ou\n' +
                       'iniciantes. Experiência e dificuldade balanceada.\n' +
                       'HP, status e velocidades padrão do jogo.';
            } else if (symbol === 'hard') {
                text = 'Dificuldade aumentada. Recomendada a jogadores \n' +
                       'experientes ou que já finalizaram o jogo.\n' +
                       '• Inimigos: 150% HP, 130% Status, 120% Velocidade\n' +
                       '• Cura do jogador: 85%, Chance de escapar: 75%' ;
            } else if (symbol === 'veryhard') {
                text = 'Dificuldade extrema. Apenas para jogadores hardcore. \n\n' +
                       '• Inimigos: 200% HP, 150% Status, 140% Velocidade\n' +
                       '• Ouro: 80%, EXP: 85%, Cura do jogador: 70%\n' +
                       '• Chance de escapar: 50% | Preço nas lojas: 130%';
            }

            if (this._helpWindow) {
                this._helpWindow.setText(text);
            }
        }
    }

    const _DataManager_setupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        _DataManager_setupNewGame.call(this);
        $gameVariables.setValue(difficultyVarId, 0);
    };

    const _Scene_Title_commandNewGame = Scene_Title.prototype.commandNewGame;
    Scene_Title.prototype.commandNewGame = function() {
        _Scene_Title_commandNewGame.call(this);
        DataManager.setupNewGame();
        SceneManager.goto(Scene_DifficultySelect);
    };

    const _Game_Enemy_paramBase = Game_Enemy.prototype.paramBase;
    Game_Enemy.prototype.paramBase = function(paramId) {
        let value = _Game_Enemy_paramBase.call(this, paramId);
        if ($gameVariables) {
            const diff = $gameVariables.value(difficultyVarId);

            if (diff === 2) {
                if (paramId === 0) {
                    value = Math.floor(value * 1.50);
                } else if (paramId === 2 || paramId === 3 || paramId === 4 || paramId === 5) {
                    value = Math.floor(value * 1.30);
                } else if (paramId === 6) {
                    value = Math.floor(value * 1.20);
                }
            } else if (diff === 3) {
                if (paramId === 0) {
                    value = Math.floor(value * 2.00);
                } else if (paramId === 2 || paramId === 3 || paramId === 4 || paramId === 5) {
                    value = Math.floor(value * 1.50);
                } else if (paramId === 6) {
                    value = Math.floor(value * 1.40);
                }
            }
        }

        return value;
    };

    const _Game_Troop_goldTotal = Game_Troop.prototype.goldTotal;
    Game_Troop.prototype.goldTotal = function() {
        let gold = _Game_Troop_goldTotal.call(this);

        if ($gameVariables && $gameVariables.value(difficultyVarId) === 3) {
            gold = Math.floor(gold * 0.80);
        }

        return gold;
    };

    const _Game_Troop_expTotal = Game_Troop.prototype.expTotal;
    Game_Troop.prototype.expTotal = function() {
        let exp = _Game_Troop_expTotal.call(this);

        if ($gameVariables && $gameVariables.value(difficultyVarId) === 3) {
            exp = Math.floor(exp * 0.85);
        }

        return exp;
    };

const _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
Game_Action.prototype.makeDamageValue = function(target, critical) {
    let damage = _Game_Action_makeDamageValue.call(this, target, critical);
    if (damage < 0 && this.isForFriend() && $gameVariables) {
        const diff = $gameVariables.value(difficultyVarId);
        let healMod = 1.0;

        if (diff === 2) {
            healMod = 0.85;
        } else if (diff === 3) {
            healMod = 0.70;
        }

        if (healMod !== 1.0) {
            damage = Math.floor(damage * healMod);
        }
    }

    return damage;
};

const _Window_ShopBuy_price = Window_ShopBuy.prototype.price;
Window_ShopBuy.prototype.price = function(item) {
    const basePrice = _Window_ShopBuy_price.call(this, item);

    if ($gameVariables && $gameVariables.value(difficultyVarId) === 3) {
        return Math.floor(basePrice * 1.30);
    }

    return basePrice;
};

const _Game_Action_applyCritical = Game_Action.prototype.applyCritical;
Game_Action.prototype.applyCritical = function(damage) {
    return damage * 2;
};

})();


