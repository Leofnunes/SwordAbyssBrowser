/*:
@target MZ
@plugindesc ⚡1.0.0⚡ Custom on-screen controls with D-pad and action buttons
@author Leandro Nunes
@url www.1337games.com.br

@help
============================================================================
Custom On-Screen Controls - Version 1.0.0
============================================================================

Provides responsive on-screen controls for mobile and touch devices:
- Directional Pad (D-pad) for movement
- Select Button (Confirm/Action)
- Cancel Button (Back/Menu)

Features:
- Works on mobile, tablet, and desktop
- Supports diagonal movement
- Visual feedback (pressed/unpressed states)
- Customizable positioning and size
- Can disable default touch controls

============================================================================
Setup Instructions
============================================================================

1. Create a folder: img/touch_controls/
2. Place your button images there with naming convention:
   - dpad.png / dpad_pressed.png
   - select.png / select_pressed.png
   - cancel.png / cancel_pressed.png

3. Configure the plugin parameters below

============================================================================

@param enableOnMobile
@text Ativar no Celular
@type boolean
@desc Ativa os controles em dispositivos móveis
@default true

@param enableOnDesktop
@text Ativar no Desktop
@type boolean
@desc Ativa os controles no desktop (útil para testes)
@default false

@param showInGameOption
@text Mostrar no Menu de Opções
@type boolean
@desc Adiciona uma opção de ativação no menu de opções do jogo
@default true

@param optionName
@text Nome no Menu de Opções
@type text
@desc Nome exibido no menu de opções
@default On-Screen Controls

@param disableDefaultTouch
@text Desativar Toque Padrão
@type boolean
@desc Desativa o clique para mover padrão do RPG Maker
@default true

@param hideOnMessage
@text Ocultar Durante Mensagens
@type boolean
@desc Oculta os controles quando caixas de texto ou mensagens aparecem
@default true

@param debugMode
@text Modo de Depuração
@type boolean
@desc Exibe mensagens no console para depuração
@default false

@param dpadSettings
@text Configurações do Direcional
@type struct<DPadConfig>
@desc Configura o direcional
@default {"image":"dpad","size":"22","positionX":"5","positionY":"70","anchor":"bottom-left"}

@param selectSettings
@text Configurações do Botão Selecionar
@type struct<ButtonConfig>
@desc Configura o botão de selecionar ou confirmar
@default {"image":"select","size":"12","positionX":"80","positionY":"75","anchor":"bottom-right","keyCode":"ok"}

@param cancelSettings
@text Configurações do Botão Cancelar
@type struct<ButtonConfig>
@desc Configura o botão de cancelar
@default {"image":"cancel","size":"12","positionX":"65","positionY":"75","anchor":"bottom-right","keyCode":"cancel"}
*/

/*~struct~DPadConfig:
@param image
@text Image Name
@type text
@desc Image filename (without extension) in img/touch_controls/
@default dpad

@param size
@text Size (%)
@type number
@min 10
@max 50
@desc Size as percentage of screen width
@default 22

@param positionX
@text Position X (%)
@type number
@min 0
@max 100
@desc Horizontal position as percentage of screen width
@default 5

@param positionY
@text Position Y (%)
@type number
@min 0
@max 100
@desc Vertical position as percentage of screen height
@default 70

@param anchor
@text Anchor
@type select
@option top-left
@option top-right
@option bottom-left
@option bottom-right
@desc Screen anchor used for positioning
@default bottom-left
*/

/*~struct~ButtonConfig:
@param image
@text Image Name
@type text
@desc Image filename (without extension) in img/touch_controls/
@default button

@param size
@text Size (%)
@type number
@min 5
@max 30
@desc Size as percentage of screen width
@default 12

@param positionX
@text Position X (%)
@type number
@min 0
@max 100
@desc Horizontal position as percentage of screen width
@default 80

@param positionY
@text Position Y (%)
@type number
@min 0
@max 100
@desc Vertical position as percentage of screen height
@default 75

@param anchor
@text Anchor
@type select
@option top-left
@option top-right
@option bottom-left
@option bottom-right
@desc Screen anchor used for positioning
@default bottom-right

@param keyCode
@text Action Key
@type combo
@option ok
@option cancel
@option shift
@option menu
@desc Input action triggered by the button
@default ok
*/

(() => {
    'use strict';

    const pluginName = 'CustomOnScreenControls';
    const parameters = PluginManager.parameters(pluginName);
    function parseJsonParam(paramString, defaultValue) {
        try {
            return paramString ? JSON.parse(paramString) : defaultValue;
        } catch (e) {
            console.error(`CustomOnScreenControls: Error parsing parameter:`, e);
            return defaultValue;
        }
    }
    const config = {
        enableOnMobile: parameters.enableOnMobile === 'true',
        enableOnDesktop: parameters.enableOnDesktop === 'true',
        disableDefaultTouch: parameters.disableDefaultTouch === 'true',
        hideOnMessage: parameters.hideOnMessage === 'true',
        debugMode: parameters.debugMode === 'true',
        showInGameOption: parameters.showInGameOption === 'true',
        optionName: parameters.optionName || 'On-Screen Controls',
        dpad: parseJsonParam(parameters.dpadSettings, {
            image: 'dpad',
            size: '22',
            positionX: '5',
            positionY: '70',
            anchor: 'bottom-left'
        }),
        select: parseJsonParam(parameters.selectSettings, {
            image: 'select',
            size: '12',
            positionX: '80',
            positionY: '75',
            anchor: 'bottom-right',
            keyCode: 'ok'
        }),
        cancel: parseJsonParam(parameters.cancelSettings, {
            image: 'cancel',
            size: '12',
            positionX: '65',
            positionY: '75',
            anchor: 'bottom-right',
            keyCode: 'cancel'
        })
    };
    function debugLog(...args) {
        if (config.debugMode) {
            console.log('[CustomControls]', ...args);
        }
    }

    debugLog('Plugin initialized with config:', config);
    class TouchController {
        constructor() {
            this.container = null;
            this.element = null;
            this.image = null;
            this.bounds = new Rectangle(0, 0, 0, 0);
            this.active = false;
            this.touchId = null;
            this.visible = false;
            this.imageLoaded = false;
        }

        initialize() {
            debugLog(`Initializing ${this.constructor.name}`);
            this.createElements();
            this.setupEventListeners();
        }

        createElements() {
        }

        setupEventListeners() {
            if (Utils.isMobileDevice()) {
                this.element.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
                document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
                document.addEventListener('touchend', this.onTouchEnd.bind(this));
            } else {
                this.element.addEventListener('mousedown', this.onMouseDown.bind(this));
                document.addEventListener('mousemove', this.onMouseMove.bind(this));
                document.addEventListener('mouseup', this.onMouseUp.bind(this));
            }
        }

        createContainer(id) {
            const div = document.createElement('div');
            div.id = id;
            div.style.position = 'fixed';
            div.style.userSelect = 'none';
            div.style.touchAction = 'none';
            div.style.visibility = 'hidden';
            div.style.zIndex = '100';
            return div;
        }

        createImage(imageName) {
            const img = document.createElement('img');
            img.draggable = false;
            img.style.display = 'block';
            img.style.pointerEvents = 'none';
            img.style.userSelect = 'none';

            const basePath = 'img/touch_controls/';
            img.src = `${basePath}${imageName}.png`;
            img.dataset.normal = `${basePath}${imageName}.png`;
            img.dataset.pressed = `${basePath}${imageName}_pressed.png`;
            img.onerror = () => {
                console.error(`CustomOnScreenControls: Failed to load image: ${img.src}`);
                debugLog(`Image load error: ${img.src}`);
            };

            return img;
        }

        applyPositioning(settings) {
            const size = parseInt(settings.size) || 20;
            const posX = parseInt(settings.positionX) || 0;
            const posY = parseInt(settings.positionY) || 0;
            const anchor = settings.anchor || 'bottom-left';

            this.image.style.width = `${size}vw`;
            this.image.style.height = 'auto';
            this.element.style.width = `${size}vw`;
            if (anchor.includes('left')) {
                this.element.style.left = `${posX}vw`;
                this.element.style.right = 'auto';
            } else {
                this.element.style.right = `${100 - posX}vw`;
                this.element.style.left = 'auto';
            }

            if (anchor.includes('top')) {
                this.element.style.top = `${posY}vh`;
                this.element.style.bottom = 'auto';
            } else {
                this.element.style.bottom = `${100 - posY}vh`;
                this.element.style.top = 'auto';
            }

            debugLog(`Applied positioning for ${this.constructor.name}:`, {
                size, posX, posY, anchor
            });
        }

        updateBounds() {
            const rect = this.element.getBoundingClientRect();
            this.bounds.x = rect.x;
            this.bounds.y = rect.y;
            this.bounds.width = rect.width;
            this.bounds.height = rect.height;
            debugLog(`Updated bounds for ${this.constructor.name}:`, this.bounds);
        }

        show() {
            if (this.element) {
                this.element.style.visibility = 'visible';
                this.visible = true;
                this.updateBounds();
                debugLog(`${this.constructor.name} shown`);
            }
        }

        hide() {
            if (this.element) {
                this.element.style.visibility = 'hidden';
                this.visible = false;
                this.deactivate();
                debugLog(`${this.constructor.name} hidden`);
            }
        }

        activate() {
            this.active = true;
            if (this.image && this.imageLoaded) {
                this.image.src = this.image.dataset.pressed;
            }
        }

        deactivate() {
            this.active = false;
            this.touchId = null;
            if (this.image && this.imageLoaded) {
                this.image.src = this.image.dataset.normal;
            }
        }

        getTouchPosition(event) {
            if (event.touches && event.touches.length > 0) {
                return { x: event.touches[0].clientX, y: event.touches[0].clientY };
            }
            return { x: event.clientX, y: event.clientY };
        }

        containsPoint(x, y) {
            return x >= this.bounds.x && x <= this.bounds.x + this.bounds.width &&
                   y >= this.bounds.y && y <= this.bounds.y + this.bounds.height;
        }

        onTouchStart(event) {
            event.preventDefault();
            event.stopPropagation();
            if (event.changedTouches && event.changedTouches.length > 0) {
                this.touchId = event.changedTouches[0].identifier;
            }
            this.activate();
            this.handlePress(event);
        }

        onTouchMove(event) {
            if (!this.active) return;
            if (!this.matchesTouchId(event)) return;
            event.preventDefault();
            this.handleMove(event);
        }

        onTouchEnd(event) {
            if (!this.active && !this.matchesTouchId(event)) return;
            this.handleRelease(event);
            this.deactivate();
        }

        onMouseDown(event) {
            event.preventDefault();
            event.stopPropagation();
            this.activate();
            this.handlePress(event);
        }

        onMouseMove(event) {
            if (!this.active) return;
            this.handleMove(event);
        }

        onMouseUp(event) {
            if (!this.active) return;
            this.handleRelease(event);
            this.deactivate();
        }

        matchesTouchId(event) {
            if (!event.changedTouches) return true;
            for (let touch of event.changedTouches) {
                if (touch.identifier === this.touchId) {
                    return true;
                }
            }
            return false;
        }

        handlePress(event) {
        }

        handleMove(event) {
        }

        handleRelease(event) {
        }
    }
    class DPadController extends TouchController {
        constructor(settings) {
            super();
            this.settings = settings;
            this.currentDirection = 0;
            this.zones = {};
        }

        createElements() {
            this.element = this.createContainer('customDPad');
            this.image = this.createImage(this.settings.image);
            this.element.appendChild(this.image);

            this.image.onload = () => {
                this.imageLoaded = true;
                debugLog('D-pad image loaded, applying positioning');
                this.applyPositioning(this.settings);
                setTimeout(() => {
                    this.updateBounds();
                    this.createDirectionZones();
                }, 100);
            };
        }

        createDirectionZones() {
            const totalW = this.bounds.width;
            const totalH = this.bounds.height;
            const x = this.bounds.x;
            const y = this.bounds.y;
            this.zones = {
                7: new Rectangle(x, y, totalW * 0.33, totalH * 0.33),
                8: new Rectangle(x + totalW * 0.33, y, totalW * 0.34, totalH * 0.33),
                9: new Rectangle(x + totalW * 0.67, y, totalW * 0.33, totalH * 0.33),

                4: new Rectangle(x, y + totalH * 0.33, totalW * 0.30, totalH * 0.34),
                5: new Rectangle(x + totalW * 0.30, y + totalH * 0.33, totalW * 0.40, totalH * 0.34),
                6: new Rectangle(x + totalW * 0.70, y + totalH * 0.33, totalW * 0.30, totalH * 0.34),

                1: new Rectangle(x, y + totalH * 0.67, totalW * 0.33, totalH * 0.33),
                2: new Rectangle(x + totalW * 0.33, y + totalH * 0.67, totalW * 0.34, totalH * 0.33),
                3: new Rectangle(x + totalW * 0.67, y + totalH * 0.67, totalW * 0.33, totalH * 0.33)
            };
            debugLog('D-pad zones created:', this.zones);
        }

        getDirectionFromPosition(x, y) {
            for (let dir in this.zones) {
                const zone = this.zones[dir];
                if (x >= zone.x && x <= zone.x + zone.width &&
                    y >= zone.y && y <= zone.y + zone.height) {
                    return parseInt(dir);
                }
            }
            return 0;
        }

        handlePress(event) {
            const pos = this.getTouchPosition(event);
            this.currentDirection = this.getDirectionFromPosition(pos.x, pos.y);
            this.applyDirection(this.currentDirection);
            debugLog('D-pad pressed, direction:', this.currentDirection);
        }

        handleMove(event) {
            const pos = this.getTouchPosition(event);
            const newDir = this.getDirectionFromPosition(pos.x, pos.y);

            if (newDir !== this.currentDirection) {
                this.currentDirection = newDir;
                this.applyDirection(this.currentDirection);
            }
        }

        handleRelease(event) {
            this.clearDirections();
            this.currentDirection = 0;
            debugLog('D-pad released');
        }

        applyDirection(dir) {
            this.clearDirections();
            const dirMap = {
                1: { down: true, left: true },
                2: { down: true },
                3: { down: true, right: true },
                4: { left: true },
                6: { right: true },
                7: { up: true, left: true },
                8: { up: true },
                9: { up: true, right: true }
            };

            if (dirMap[dir]) {
                Input._currentState['up'] = dirMap[dir].up || false;
                Input._currentState['down'] = dirMap[dir].down || false;
                Input._currentState['left'] = dirMap[dir].left || false;
                Input._currentState['right'] = dirMap[dir].right || false;
            }
        }

        clearDirections() {
            Input._currentState['up'] = false;
            Input._currentState['down'] = false;
            Input._currentState['left'] = false;
            Input._currentState['right'] = false;
        }

        deactivate() {
            super.deactivate();
            this.clearDirections();
        }
    }
    class ActionButton extends TouchController {
        constructor(settings) {
            super();
            this.settings = settings;
            this.keyCode = settings.keyCode || 'ok';
        }

        createElements() {
            this.element = this.createContainer(`customButton_${this.keyCode}`);
            this.image = this.createImage(this.settings.image);
            this.element.appendChild(this.image);

            this.image.onload = () => {
                this.imageLoaded = true;
                debugLog(`${this.keyCode} button image loaded`);
                this.applyPositioning(this.settings);
                setTimeout(() => {
                    this.updateBounds();
                }, 100);
            };
        }

        handlePress(event) {
            Input._currentState[this.keyCode] = true;
            debugLog(`${this.keyCode} button pressed`);
        }

        handleMove(event) {
            const pos = this.getTouchPosition(event);
            if (!this.containsPoint(pos.x, pos.y)) {
                this.handleRelease(event);
            }
        }

        handleRelease(event) {
            Input._currentState[this.keyCode] = false;
            debugLog(`${this.keyCode} button released`);
        }

        deactivate() {
            super.deactivate();
            Input._currentState[this.keyCode] = false;
        }
    }
    class ControlManager {
        constructor() {
            this.container = null;
            this.dpad = null;
            this.selectButton = null;
            this.cancelButton = null;
            this.initialized = false;
        }

        initialize() {
            if (this.initialized) {
                debugLog('Controls already initialized');
                return;
            }

            if (!this.shouldEnable()) {
                debugLog('Controls not enabled for this platform');
                return;
            }

            debugLog('Initializing control manager');
            this.createContainer();
            this.createControls();
            this.initialized = true;
            debugLog('Control manager initialized successfully');
        }

        shouldEnable() {
            const isMobile = Utils.isMobileDevice();
            const isDesktop = Utils.isNwjs();

            debugLog('Platform check:', {
                isMobile,
                isDesktop,
                enableOnMobile: config.enableOnMobile,
                enableOnDesktop: config.enableOnDesktop
            });

            if (isMobile && config.enableOnMobile) return true;
            if (isDesktop && config.enableOnDesktop) return true;
            if (!isMobile && !isDesktop && config.enableOnDesktop) return true;

            return false;
        }

        createContainer() {
            this.container = document.createElement('div');
            this.container.id = 'customOnScreenControls';
            this.container.style.position = 'fixed';
            this.container.style.top = '0';
            this.container.style.left = '0';
            this.container.style.width = '100%';
            this.container.style.height = '100%';
            this.container.style.pointerEvents = 'none';
            this.container.style.zIndex = '100';
            this.container.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });

            document.body.appendChild(this.container);
            debugLog('Control container created and added to DOM');
        }

        createControls() {
            debugLog('Creating D-pad with settings:', config.dpad);
            this.dpad = new DPadController(config.dpad);
            this.dpad.initialize();
            this.dpad.element.style.pointerEvents = 'auto';
            this.container.appendChild(this.dpad.element);
            debugLog('Creating select button with settings:', config.select);
            this.selectButton = new ActionButton(config.select);
            this.selectButton.initialize();
            this.selectButton.element.style.pointerEvents = 'auto';
            this.container.appendChild(this.selectButton.element);
            debugLog('Creating cancel button with settings:', config.cancel);
            this.cancelButton = new ActionButton(config.cancel);
            this.cancelButton.initialize();
            this.cancelButton.element.style.pointerEvents = 'auto';
            this.container.appendChild(this.cancelButton.element);

            debugLog('All controls created');
        }

        showControls() {
            if (!this.initialized) {
                debugLog('Cannot show controls - not initialized');
                return;
            }
            if (config.showInGameOption && !ConfigManager.onScreenControls) {
                debugLog('Controls disabled by player preference');
                return;
            }

            debugLog('Showing all controls');
            this.dpad.show();
            this.selectButton.show();
            this.cancelButton.show();
        }

        hideControls() {
            if (!this.initialized) return;
            debugLog('Hiding all controls');
            this.dpad.hide();
            this.selectButton.hide();
            this.cancelButton.hide();
        }

        refresh() {
            if (!this.initialized) return;
            debugLog('Refreshing all controls');
            this.dpad.updateBounds();
            this.selectButton.updateBounds();
            this.cancelButton.updateBounds();
            if (this.dpad.visible) {
                this.dpad.createDirectionZones();
            }
        }

        isPointOverControl(x, y) {
            if (!this.initialized) return false;
            return this.dpad.containsPoint(x, y) ||
                   this.selectButton.containsPoint(x, y) ||
                   this.cancelButton.containsPoint(x, y);
        }
    }
    window.$customControls = new ControlManager();
    if (config.showInGameOption) {
        ConfigManager.onScreenControls = true;

        const _ConfigManager_makeData = ConfigManager.makeData;
        ConfigManager.makeData = function() {
            const configData = _ConfigManager_makeData.call(this);
            configData.onScreenControls = this.onScreenControls;
            return configData;
        };

        const _ConfigManager_applyData = ConfigManager.applyData;
        ConfigManager.applyData = function(configData) {
            _ConfigManager_applyData.call(this, configData);
            this.onScreenControls = this.readFlag(configData, 'onScreenControls', true);
        };
        Object.defineProperty(ConfigManager, 'onScreenControls', {
            get: function() {
                return this._onScreenControls !== undefined ? this._onScreenControls : true;
            },
            set: function(value) {
                this._onScreenControls = value;
                if ($customControls && $customControls.initialized) {
                    if (value && SceneManager._scene instanceof Scene_Map) {
                        $customControls.showControls();
                    } else if (!value) {
                        $customControls.hideControls();
                    }
                }
            },
            configurable: true
        });
    }
    if (config.showInGameOption) {
        const _Window_Options_addGeneralOptions = Window_Options.prototype.addGeneralOptions;
        Window_Options.prototype.addGeneralOptions = function() {
            _Window_Options_addGeneralOptions.call(this);
            this.addCommand(config.optionName, 'onScreenControls');
        };
    }
    const _Scene_Boot_create = Scene_Boot.prototype.create;
    Scene_Boot.prototype.create = function() {
        _Scene_Boot_create.call(this);
        debugLog('Scene_Boot.create called, initializing controls');
        $customControls.initialize();
    };
    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        debugLog('Scene_Map.start called, showing controls');
        $customControls.showControls();
    };

    const _Scene_Map_stop = Scene_Map.prototype.stop;
    Scene_Map.prototype.stop = function() {
        _Scene_Map_stop.call(this);
        debugLog('Scene_Map.stop called, hiding controls');
        $customControls.hideControls();
    };
    if (config.disableDefaultTouch) {
        const _Game_Temp_setDestination = Game_Temp.prototype.setDestination;
        Game_Temp.prototype.setDestination = function(x, y) {
            if ($customControls && $customControls.isPointOverControl(TouchInput.x, TouchInput.y)) {
                return;
            }
            if ($customControls && $customControls.initialized) {
                if ($customControls.dpad.active ||
                    $customControls.selectButton.active ||
                    $customControls.cancelButton.active) {
                    return;
                }
            }

            _Game_Temp_setDestination.call(this, x, y);
        };
    }
    const _Scene_Battle_start = Scene_Battle.prototype.start;
    Scene_Battle.prototype.start = function() {
        _Scene_Battle_start.call(this);
        debugLog('Scene_Battle.start called, hiding controls');
        $customControls.hideControls();
    };

    const _Scene_Battle_stop = Scene_Battle.prototype.stop;
    Scene_Battle.prototype.stop = function() {
        _Scene_Battle_stop.call(this);
        debugLog('Scene_Battle.stop called - controls will be restored by Scene_Map.start');
    };
    const _Graphics_onResize = Graphics._onResize;
    Graphics._onResize = function() {
        _Graphics_onResize.call(this);
        if ($customControls) {
            setTimeout(() => $customControls.refresh(), 100);
        }
    };
    if (config.hideOnMessage) {
        const _Window_Message_startMessage = Window_Message.prototype.startMessage;
        Window_Message.prototype.startMessage = function() {
            _Window_Message_startMessage.call(this);
            if ($customControls && (!config.showInGameOption || ConfigManager.onScreenControls)) {
                debugLog('Message started - hiding controls');
                $customControls.hideControls();
            }
        };

        const _Window_Message_terminateMessage = Window_Message.prototype.terminateMessage;
        Window_Message.prototype.terminateMessage = function() {
            _Window_Message_terminateMessage.call(this);
            if ($customControls && SceneManager._scene instanceof Scene_Map) {
                if (!config.showInGameOption || ConfigManager.onScreenControls) {
                    debugLog('Message ended - showing controls');
                    $customControls.showControls();
                }
            }
        };
    }

})();


