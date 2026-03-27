
/*:
 * @target MZ
 * @plugindesc Plugin de janela de mensagem customizada com personagem full body
 * @author Leandro Nunes
 * @url www.1337games.com.br
 *
 * @param windowWidth
 * @text Largura da Janela
 * @type number
 * @min 400
 * @max 1200
 * @default 800
 * @desc Largura da janela de mensagem em pixels
 *
 * @param windowHeight
 * @text Altura da Janela
 * @type number
 * @min 150
 * @max 400
 * @default 200
 * @desc Altura da janela de mensagem em pixels
 *
 * @param fontSize
 * @text Tamanho da Fonte
 * @type number
 * @min 16
 * @max 48
 * @default 28
 * @desc Tamanho da fonte do texto
 *
 * @param characterImageX
 * @text Posição X do Personagem 1
 * @type number
 * @min -500
 * @max 500
 * @default -100
 * @desc Posição X da imagem do personagem 1 (relativa à janela)
 *
 * @param characterImageY
 * @text Posição Y do Personagem 1
 * @type number
 * @min -500
 * @max 500
 * @default -300
 * @desc Posição Y da imagem do personagem 1 (relativa à janela)
 *
 * @param characterImage2X
 * @text Posição X do Personagem 2
 * @type number
 * @min -500
 * @max 1000
 * @default 600
 * @desc Posição X da imagem do personagem 2 (relativa à janela)
 *
 * @param characterImage2Y
 * @text Posição Y do Personagem 2
 * @type number
 * @min -500
 * @max 500
 * @default -300
 * @desc Posição Y da imagem do personagem 2 (relativa à janela)
 *
 * @param animationSpeed
 * @text Velocidade da Animação
 * @type number
 * @min 1
 * @max 60
 * @default 15
 * @desc Velocidade da animação de transição (frames)
 *
 * @param windowPosition
 * @text Posição da Janela
 * @type select
 * @option Superior
 * @value top
 * @option Centro
 * @value middle
 * @option Inferior
 * @value bottom
 * @default bottom
 * @desc Posição vertical da janela na tela
 *
 * @param facePosition
 * @text Posição do Retrato
 * @type select
 * @option Esquerda
 * @value left
 * @option Direita
 * @value right
 * @default right
 * @desc Posição do retrato do personagem (face)
 *
 * @param faceScale
 * @text Escala do Retrato
 * @type number
 * @min 0.5
 * @max 3.0
 * @decimals 1
 * @default 1.0
 * @desc Tamanho do retrato (1.0 = 100%, 1.5 = 150%, 2.0 = 200%, etc)
 *
 * @help
 * ============================================================================
 * Introdução
 * ============================================================================
 * 
 * Este plugin substitui a janela de mensagem padrão por uma versão customizada
 * que suporta até 2 imagens de personagens em corpo inteiro (full body) 
 * simultaneamente ao invés de apenas rostos (faces).
 * 
 * ============================================================================
 * Como Usar
 * ============================================================================
 * 
 * 1. Coloque as imagens dos personagens full body na pasta img/pictures/
 * 2. Nomeie os arquivos como: actor1_fullbody.png, actor2_fullbody.png, etc.
 * 
 * Para exibir personagens durante o diálogo, use os comandos:
 * \FB1[nomeDoArquivo] - Define o personagem 1 (posição esquerda/configurável)
 * \FB2[nomeDoArquivo] - Define o personagem 2 (posição direita/configurável)
 * 
 * Exemplos: 
 * \FB1[hero_fullbody] - Mostra o herói na posição 1
 * \FB2[companion_fullbody] - Mostra o companheiro na posição 2
 * 
 * Para remover personagens:
 * \FB1[] - Remove o personagem 1
 * \FB2[] - Remove o personagem 2
 * 
 * ============================================================================
 * Comandos de Plugin
 * ============================================================================
 * 
 * Você pode usar os seguintes códigos no texto:
 * 
 * \FB1[nome] - Define a imagem full body do personagem 1
 * \FB2[nome] - Define a imagem full body do personagem 2
 * \FS[n]     - Muda o tamanho da fonte para n
 * 
 */

(() => {
    'use strict';

    const pluginName = "CustomMessageWindow";
    const parameters = PluginManager.parameters(pluginName);

    const windowWidth = Number(parameters['windowWidth'] || 800);
    const windowHeight = Number(parameters['windowHeight'] || 200);
    const fontSize = Number(parameters['fontSize'] || 28);
    const characterImageX = Number(parameters['characterImageX'] || -100);
    const characterImageY = Number(parameters['characterImageY'] || -300);
    const characterImage2X = Number(parameters['characterImage2X'] || 600);
    const characterImage2Y = Number(parameters['characterImage2Y'] || -300);
    const animationSpeed = Number(parameters['animationSpeed'] || 15);
    const windowPosition = String(parameters['windowPosition'] || 'bottom');
    const facePosition = String(parameters['facePosition'] || 'right');
    const faceScale = Number(parameters['faceScale'] || 1.0);

    const _Window_Message_initialize = Window_Message.prototype.initialize;
    Window_Message.prototype.initialize = function(rect) {
        this._fullBodyImage1 = null;
        this._fullBodyImage2 = null;
        this._fullBodySprite1 = null;
        this._fullBodySprite2 = null;
        this._fullBodyContainer = null;
        this._faceSprite = null;
        this._targetOpacity = 0;
        this._animationProgress = 0;
        _Window_Message_initialize.call(this, rect);
        this.createFullBodyContainer();
        this.createFaceSprite();
    };

    Window_Message.prototype.createFullBodyContainer = function() {
        this._fullBodyContainer = new Sprite();
        const index = this.children.indexOf(this._windowSpriteContainer);
        this.addChildAt(this._fullBodyContainer, index + 1);
    };

    Window_Message.prototype.createFaceSprite = function() {
        this._faceSprite = new Sprite();
        this.addChild(this._faceSprite);
    };

    const _Window_Message_createContents = Window_Message.prototype.createContents;
    Window_Message.prototype.createContents = function() {
        _Window_Message_createContents.call(this);
        this.contents.fontSize = fontSize;
    };

    Window_Message.prototype.windowWidth = function() {
        return windowWidth;
    };

    Window_Message.prototype.windowHeight = function() {
        return windowHeight;
    };

    const _Window_Message_updatePlacement = Window_Message.prototype.updatePlacement;
    Window_Message.prototype.updatePlacement = function() {
        const width = this.windowWidth();
        const height = this.windowHeight();
        this.width = width;
        this.height = height;
        this.x = (Graphics.boxWidth - width) / 2;

        if (windowPosition === 'top') {
            this.y = 0;
        } else if (windowPosition === 'middle') {
            this.y = (Graphics.boxHeight - height) / 2;
        } else {
            this.y = Graphics.boxHeight - height;
        }

        this._goldWindow.y = this.y > 0 ? 0 : Graphics.boxHeight - this._goldWindow.height;
    };

    const _Window_Message_startMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function() {
        _Window_Message_startMessage.call(this);
        this._targetOpacity = 255;
        this._animationProgress = 0;
        this.contentsOpacity = 0;
        this.updateFullBodyImages();
        this.updateFaceSprite();
    };

    const _Window_Message_terminateMessage = Window_Message.prototype.terminateMessage;
    Window_Message.prototype.terminateMessage = function() {
        this._targetOpacity = 0;
        this._animationProgress = 0;
        _Window_Message_terminateMessage.call(this);
    };

    Window_Message.prototype.updateFullBodyImages = function() {
        this.updateFullBodyImage1();
        this.updateFullBodyImage2();
    };

    Window_Message.prototype.updateFaceSprite = function() {
        const faceName = $gameMessage.faceName();
        const faceIndex = $gameMessage.faceIndex();

        if (!this._faceSprite) {
            this.createFaceSprite();
        }

        if (faceName) {
            const bitmap = ImageManager.loadFace(faceName);
            const width = ImageManager.faceWidth;
            const height = ImageManager.faceHeight;
            const tempBitmap = new Bitmap(width, height);
            const sx = (faceIndex % 4) * width;
            const sy = Math.floor(faceIndex / 4) * height;

            bitmap.addLoadListener(() => {
                tempBitmap.blt(bitmap, sx, sy, width, height, 0, 0);
                this._faceSprite.bitmap = tempBitmap;
                this._faceSprite.scale.x = faceScale;
                this._faceSprite.scale.y = faceScale;

                const scaledWidth = width * faceScale;
                const scaledHeight = height * faceScale;

                if (facePosition === 'right') {
                    this._faceSprite.x = this.innerWidth - scaledWidth + this.padding;
                } else {
                    this._faceSprite.x = this.padding;
                }

                this._faceSprite.y = this.padding + (this.innerHeight - scaledHeight) / 2;
            });
        } else {
            this._faceSprite.bitmap = null;
        }
    };

    Window_Message.prototype.updateFullBodyImage1 = function() {
        if (!this._fullBodySprite1) {
            this._fullBodySprite1 = new Sprite();
            this._fullBodyContainer.addChild(this._fullBodySprite1);
        }

        if (this._fullBodyImage1 && this._fullBodyImage1 !== '') {
            const bitmap = ImageManager.loadPicture(this._fullBodyImage1);
            this._fullBodySprite1.bitmap = bitmap;
            this._fullBodySprite1.x = characterImageX;
            this._fullBodySprite1.y = characterImageY;
            this._fullBodySprite1.opacity = 0;
        } else if (this._fullBodySprite1) {
            this._fullBodySprite1.bitmap = null;
        }
    };

    Window_Message.prototype.updateFullBodyImage2 = function() {
        if (!this._fullBodySprite2) {
            this._fullBodySprite2 = new Sprite();
            this._fullBodyContainer.addChild(this._fullBodySprite2);
        }

        if (this._fullBodyImage2 && this._fullBodyImage2 !== '') {
            const bitmap = ImageManager.loadPicture(this._fullBodyImage2);
            this._fullBodySprite2.bitmap = bitmap;
            this._fullBodySprite2.x = characterImage2X;
            this._fullBodySprite2.y = characterImage2Y;
            this._fullBodySprite2.opacity = 0;
        } else if (this._fullBodySprite2) {
            this._fullBodySprite2.bitmap = null;
        }
    };

    const _Window_Message_update = Window_Message.prototype.update;
    Window_Message.prototype.update = function() {
        _Window_Message_update.call(this);
        this.updateAnimation();
    };

    Window_Message.prototype.updateAnimation = function() {
        if (this.contentsOpacity !== this._targetOpacity) {
            this._animationProgress++;
            const progress = this._animationProgress / animationSpeed;
            const easeProgress = this.easeInOut(Math.min(progress, 1));

            if (this._targetOpacity > this.contentsOpacity) {
                this.contentsOpacity = Math.floor(this._targetOpacity * easeProgress);
                if (this._fullBodySprite1) {
                    this._fullBodySprite1.opacity = this.contentsOpacity;
                }
                if (this._fullBodySprite2) {
                    this._fullBodySprite2.opacity = this.contentsOpacity;
                }
                if (this._faceSprite) {
                    this._faceSprite.opacity = this.contentsOpacity;
                }
            } else {
                this.contentsOpacity = Math.floor(255 * (1 - easeProgress));
                if (this._fullBodySprite1) {
                    this._fullBodySprite1.opacity = this.contentsOpacity;
                }
                if (this._fullBodySprite2) {
                    this._fullBodySprite2.opacity = this.contentsOpacity;
                }
                if (this._faceSprite) {
                    this._faceSprite.opacity = this.contentsOpacity;
                }
            }
        }
    };

    Window_Message.prototype.easeInOut = function(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    };

    const _Window_Message_processEscapeCharacter = Window_Message.prototype.processEscapeCharacter;
    Window_Message.prototype.processEscapeCharacter = function(code, textState) {
        switch (code) {
            case 'FB1':
                this.processFullBodyImage1(this.obtainEscapeParam(textState));
                break;
            case 'FB2':
                this.processFullBodyImage2(this.obtainEscapeParam(textState));
                break;
            case 'FS':
                this.contents.fontSize = this.obtainEscapeParam(textState);
                break;
            default:
                _Window_Message_processEscapeCharacter.call(this, code, textState);
                break;
        }
    };

    Window_Message.prototype.processFullBodyImage1 = function(imageName) {
        if (typeof imageName === 'string') {
            this._fullBodyImage1 = imageName;
        } else {
            this._fullBodyImage1 = String(imageName);
        }
        this.updateFullBodyImage1();
    };

    Window_Message.prototype.processFullBodyImage2 = function(imageName) {
        if (typeof imageName === 'string') {
            this._fullBodyImage2 = imageName;
        } else {
            this._fullBodyImage2 = String(imageName);
        }
        this.updateFullBodyImage2();
    };

    const _Window_Message_obtainEscapeParam = Window_Message.prototype.obtainEscapeParam;
    Window_Message.prototype.obtainEscapeParam = function(textState) {
        const arr = /^\[([^\]]*)\]/.exec(textState.text.slice(textState.index));
        if (arr) {
            textState.index += arr[0].length;
            return arr[1];
        } else {
            return _Window_Message_obtainEscapeParam.call(this, textState);
        }
    };

    Window_Message.prototype.newLineX = function(textState) {
        const faceExists = $gameMessage.faceName() !== "";
        if (faceExists && facePosition === 'right') {
            return 0;
        } else if (faceExists && facePosition === 'left') {
            const scaledWidth = ImageManager.faceWidth * faceScale;
            return scaledWidth + 8;
        } else {
            return 0;
        }
    };

    Window_Message.prototype.drawMessageFace = function() {
    };

})();


