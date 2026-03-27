
/*:
 * @target MZ
 * @plugindesc Tela inicial customizada com design melhorado e opção de créditos
 * @author Leandro Nunes
 * @url www.1337games.com.br
 *
 * @param titleText
 * @text Texto do Título
 * @desc Texto que aparecerá no topo da tela
 * @default MEU JOGO RPG
 *
 * @param showCreditsOption
 * @text Mostrar Opção Créditos
 * @desc Adiciona opção "Créditos" no menu principal
 * @type boolean
 * @default true
 *
 * @param showExitOption
 * @text Mostrar Opção Sair
 * @desc Adiciona opção "Sair do Jogo" no menu principal
 * @type boolean
 * @default true
 *
 * @param creditsText
 * @text Texto dos Créditos
 * @desc Texto que aparecerá na tela de créditos (use \n para quebra de linha)
 * @type note
 * @default "Equipe 1337Games\n\nProgramação/Scripts: Leandro Nunes\nLevel design/Mapas: Leandro Nunes\nBalanceamento do jogo: Leandro Nunes\nUI/UX/Menus/Hud: Leandro Nunes\nSFX: Leandro Nunes\nQA/Testes: Leandro Nunes\nControle de qualidade: Leandro Nunes\nCorreção de bugs: Leandro Nunes\nOtimização(Roda até em PC de 2005): Leandro Nunes\nCompatibilidade: Leandro Nunes\nVersionamento (Versão_final_agora-vai_v12.zip): Leandro Nunes\nRemasterização do MV para MZ: Leandro Nunes\nDocumentação (basicamente um arquivo.txt): Leandro Nunes\nLocalização: Leandro Nunes\nMarketing: Leandro Nunes\n\nDesenvolvido com: RPG Maker MZ e muita Teimosia.\nNenhum Leandro foi ferido na produção de Espada do Abismo."
 *
 * @param windowOpacity
 * @text Opacidade da Janela
 * @desc Opacidade da janela de comandos (0-255)
 * @type number
 * @min 0
 * @max 255
 * @default 200
 *
 * @param windowWidth
 * @text Largura da Janela
 * @desc Largura da janela de comandos em pixels
 * @type number
 * @min 200
 * @max 800
 * @default 400
 *
 * @param windowHeight
 * @text Altura da Janela
 * @desc Altura da janela de comandos em pixels
 * @type number
 * @min 100
 * @max 600
 * @default 350
 *
 * @param windowPositionX
 * @text Posição X da Janela
 * @desc Posição horizontal da janela (em pixels, -1 = centralizado)
 * @type number
 * @min -1
 * @max 2000
 * @default -1
 *
 * @param windowPositionY
 * @text Posição Y da Janela
 * @desc Posição vertical da janela (em pixels, -1 = centralizado)
 * @type number
 * @min -1
 * @max 2000
 * @default -1
 *
 * @param buttonHeight
 * @text Altura dos Botões
 * @desc Altura de cada botão em pixels
 * @type number
 * @min 20
 * @max 150
 * @default 50
 *
 * @param buttonFontSize
 * @text Tamanho da Fonte dos Botões
 * @desc Tamanho da fonte do texto dos botões
 * @type number
 * @min 12
 * @max 72
 * @default 26
 *
 * @param buttonSpacing
 * @text Espaçamento dos Botões
 * @desc Espaçamento vertical entre os botões
 * @type number
 * @min 0
 * @max 100
 * @default 20
 *
 * @help
 * ============================================================================
 * Instruções de Uso
 * ============================================================================
 * 
 * Este plugin modifica a tela inicial do RPG Maker MZ com:
 * - Interface visual melhorada
 * - Janela de comandos customizável (largura, altura e posição)
 * - Botões customizáveis (altura e tamanho da fonte)
 * - Opção de créditos customizável
 * - Opção de sair do jogo
 * - Efeitos visuais aprimorados
 * 
 * Para usar:
 * 1. Coloque este arquivo na pasta js/plugins do seu projeto
 * 2. Ative o plugin no Plugin Manager
 * 3. Configure os parâmetros conforme desejado
 * 4. Customize o texto dos créditos nos parâmetros
 * 
 * POSICIONAMENTO DA JANELA:
 * - Use -1 para Posição X ou Y para centralizar automaticamente
 * - Use valores positivos para posicionar manualmente em pixels
 * - Exemplo: X=100, Y=200 coloca a janela em coordenadas específicas
 * - Exemplo: X=-1, Y=-1 centraliza a janela na tela
 * 
 * NOTA: A opção "Sair do Jogo" funciona apenas quando o jogo é executado
 * como aplicativo desktop (não funciona em navegadores web).
 * 
 * ============================================================================
 * Termos de Uso
 * ============================================================================
 * Livre para uso em projetos comerciais e não-comerciais.
 * Crédito apreciado mas não obrigatório.
 */

(() => {
    'use strict';

    const pluginName = "CustomTitleScreen";
    const parameters = PluginManager.parameters(pluginName);

    const titleText = String(parameters['titleText'] || 'MEU JOGO RPG');
    const showCreditsOption = parameters['showCreditsOption'] === 'true';
    const showExitOption = parameters['showExitOption'] === 'true';
    const creditsText = JSON.parse(parameters['creditsText'] || '""');
    const windowOpacity = Number(parameters['windowOpacity'] || 200);
    const windowWidth = Number(parameters['windowWidth'] || 400);
    const windowHeight = Number(parameters['windowHeight'] || 350);
    const windowPositionX = Number(parameters['windowPositionX'] ?? -1);
    const windowPositionY = Number(parameters['windowPositionY'] ?? -1);
    const buttonHeight = Number(parameters['buttonHeight'] || 50);
    const buttonFontSize = Number(parameters['buttonFontSize'] || 26);
    const buttonSpacing = Number(parameters['buttonSpacing'] || 20);

    const _Scene_Title_create = Scene_Title.prototype.create;
    Scene_Title.prototype.create = function() {
        _Scene_Title_create.call(this);
        this.createCustomTitleSprite();
    };

    Scene_Title.prototype.createCustomTitleSprite = function() {
        this._customTitleSprite = new Sprite();
        this._customTitleSprite.bitmap = new Bitmap(Graphics.width, 200);

        const bitmap = this._customTitleSprite.bitmap;
        bitmap.fontSize = 72;
        bitmap.fontBold = true;
        bitmap.textColor = "#ffffff";
        bitmap.outlineColor = "#000000";
        bitmap.outlineWidth = 8;

        bitmap.drawText(titleText, 0, 50, Graphics.width, 72, 'center');

        this._customTitleSprite.y = 80;
        this.addChild(this._customTitleSprite);
    };

    const _Scene_Title_createCommandWindow = Scene_Title.prototype.createCommandWindow;
    Scene_Title.prototype.createCommandWindow = function() {
        _Scene_Title_createCommandWindow.call(this);
        this._commandWindow.opacity = windowOpacity;
    };

    const _Scene_Title_commandNewGame = Scene_Title.prototype.commandNewGame;
    Scene_Title.prototype.commandNewGame = function() {
        _Scene_Title_commandNewGame.call(this);
    };

    Scene_Title.prototype.commandCredits = function() {
        this._commandWindow.close();
        SceneManager.push(Scene_Credits);
    };

    Scene_Title.prototype.commandExit = function() {
        this._commandWindow.close();
        SceneManager.exit();
    };

    const _Window_TitleCommand_initialize = Window_TitleCommand.prototype.initialize;
    Window_TitleCommand.prototype.initialize = function(rect) {
        _Window_TitleCommand_initialize.call(this, rect);
        this.setBackgroundType(0);
    };

    const _Window_TitleCommand_makeCommandList = Window_TitleCommand.prototype.makeCommandList;
    Window_TitleCommand.prototype.makeCommandList = function() {
        _Window_TitleCommand_makeCommandList.call(this);
        if (showCreditsOption) {
            this.addCommand("Créditos", "credits");
        }
        if (showExitOption) {
            this.addCommand("Sair do Jogo", "exit");
        }
    };

    Scene_Title.prototype.createCommandWindow = function() {
        const background = this._commandWindow;
        const rect = this.commandWindowRect();
        this._commandWindow = new Window_TitleCommand(rect);
        this._commandWindow.setHandler("newGame", this.commandNewGame.bind(this));
        this._commandWindow.setHandler("continue", this.commandContinue.bind(this));
        this._commandWindow.setHandler("options", this.commandOptions.bind(this));
        if (showCreditsOption) {
            this._commandWindow.setHandler("credits", this.commandCredits.bind(this));
        }
        if (showExitOption) {
            this._commandWindow.setHandler("exit", this.commandExit.bind(this));
        }
        this.addWindow(this._commandWindow);
    };

    Scene_Title.prototype.commandWindowRect = function() {
        let offsetX, offsetY;
        if (windowPositionX === -1) {
            offsetX = (Graphics.boxWidth - windowWidth) / 2;
        } else {
            offsetX = windowPositionX;
        }
        if (windowPositionY === -1) {
            offsetY = (Graphics.boxHeight - windowHeight) / 2 + 50;
        } else {
            offsetY = windowPositionY;
        }

        return new Rectangle(offsetX, offsetY, windowWidth, windowHeight);
    };
    Window_TitleCommand.prototype.itemHeight = function() {
        return buttonHeight;
    };
    const _Window_TitleCommand_resetFontSettings = Window_TitleCommand.prototype.resetFontSettings;
    Window_TitleCommand.prototype.resetFontSettings = function() {
        _Window_TitleCommand_resetFontSettings.call(this);
        this.contents.fontSize = buttonFontSize;
    };
    Window_TitleCommand.prototype.lineHeight = function() {
        return buttonHeight;
    };
    Window_TitleCommand.prototype.itemPadding = function() {
        return 8;
    };

    function Scene_Credits() {
        this.initialize(...arguments);
    }

    Scene_Credits.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Credits.prototype.constructor = Scene_Credits;

    Scene_Credits.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
    };

    Scene_Credits.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createCreditsWindow();
    };

    Scene_Credits.prototype.createCreditsWindow = function() {
        const rect = this.creditsWindowRect();
        this._creditsWindow = new Window_Credits(rect);
        this._creditsWindow.setHandler("cancel", this.popScene.bind(this));
        this.addWindow(this._creditsWindow);
    };

    Scene_Credits.prototype.creditsWindowRect = function() {
        const wx = 0;
        const wy = 0;
        const ww = Graphics.boxWidth;
        const wh = Graphics.boxHeight;
        return new Rectangle(wx, wy, ww, wh);
    };

    function Window_Credits() {
        this.initialize(...arguments);
    }

    Window_Credits.prototype = Object.create(Window_Selectable.prototype);
    Window_Credits.prototype.constructor = Window_Credits;

    Window_Credits.prototype.initialize = function(rect) {
        Window_Selectable.prototype.initialize.call(this, rect);
        this.opacity = 255;
        this.refresh();
        this.activate();
    };

    Window_Credits.prototype.refresh = function() {
        this.contents.clear();

        const lines = creditsText.split('\\n');
        const lineHeight = this.lineHeight();
        let y = 20;

        this.contents.fontSize = 24;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('Equipe 1337Games')) {
                this.contents.fontBold = true;
                this.contents.fontSize = 40;
                this.drawText(line, 0, y, this.contentsWidth(), 'center');
                this.contents.fontBold = false;
                this.contents.fontSize = 24;
                y += 60;
            }
            else if (line.trim() === '') {
                y += 15;
            }
            else if (line.includes('Desenvolvido com:') || line.includes('Nenhum Leandro')) {
                this.contents.fontBold = true;
                this.contents.fontSize = 22;
                this.drawText(line, 0, y, this.contentsWidth(), 'center');
                this.contents.fontBold = false;
                this.contents.fontSize = 24;
                y += 35;
            }
            else {
                this.drawText(line, 0, y, this.contentsWidth(), 'center');
                y += 30;
            }
        }
        this.contents.fontSize = 20;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText('Pressione ESC ou Cancelar para voltar', 0, this.contentsHeight() - 40, this.contentsWidth(), 'center');
        this.resetTextColor();
    };

    Window_Credits.prototype.processCancel = function() {
        Window_Selectable.prototype.processCancel.call(this);
        this.deactivate();
    };

})();


