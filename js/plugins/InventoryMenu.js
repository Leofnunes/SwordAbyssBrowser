
/*:
 * @target MZ
 * @plugindesc Adds a custom inventory system separate from the default item menu
 * @author Leandro Nunes
 * @url www.1337games.com.br
 *
 * @param menuCommandName
 * @text Menu Command Name
 * @type text
 * @desc Name of the command in the main menu
 * @default Inventory
 *
 * @param showInMenu
 * @text Mostrar no Menu
 * @type boolean
 * @desc Adiciona o comando de inventário ao menu principal
 * @default true
 *
 * @param inventoryLayout
 * @text Inventory Layout
 * @type select
 * @option Grid
 * @value grid
 * @option List
 * @value list
 * @option Hybrid
 * @value hybrid
 * @desc Choose the layout style for the inventory
 * @default grid
 *
 * @param showItemIcons
 * @text Show Item Icons
 * @type boolean
 * @desc Display icons for items in the inventory
 * @default true
 *
 * @param showItemQuantity
 * @text Show Item Quantity
 * @type boolean
 * @desc Display quantity numbers for items
 * @default true
 *
 * @param itemsPerRow
 * @text Items Per Row
 * @type number
 * @min 1
 * @max 10
 * @desc Number of items to display per row (Grid layout)
 * @default 4
 *
 * @param enableSearch
 * @text Enable Search
 * @type boolean
 * @desc Enable search/filter functionality
 * @default true
 *
 * @param sortOptions
 * @text Sort Options
 * @type boolean
 * @desc Enable sorting options (name, type, quantity)
 * @default true
 *
 * @param windowOpacity
 * @text Window Opacity
 * @type number
 * @min 0
 * @max 255
 * @desc Opacity of inventory windows
 * @default 192
 *
 * @param showItemStats
 * @text Show Item Stats
 * @type boolean
 * @desc Show detailed stats for equipment and items
 * @default true
 *
 * @param enableFavorites
 * @text Enable Favorites
 * @type boolean
 * @desc Allow marking items as favorites
 * @default true
 *
 * @command openInventory
 * @text Open Custom Inventory
 * @desc Opens the custom inventory scene
 *
 * @help
 * ============================================================================
 * Custom Inventory Layout Plugin
 * ============================================================================
 * 
 * This plugin adds a brand new custom inventory system that runs alongside
 * the default RPG Maker item menu without replacing it.
 *
 * Features:
 * - Separate inventory scene with modern design
 * - Multiple layout styles (Grid, List, Hybrid)
 * - Search and filter functionality
 * - Sort options (name, type, quantity)
 * - Detailed stats panel
 * - Favorites system
 * - Item count and gold display
 *
 * Plugin Commands:
 * - Open Custom Inventory: Opens the custom inventory scene
 *
 * Script Call:
 * SceneManager.push(Scene_CustomInventory);
 *
 * Controls:
 * - Arrow Keys: Navigate items
 * - Enter/Space: Select/Use item
 * - Tab: Open sort options
 * - F: Toggle favorite (Shift + Enter)
 * - Escape: Close inventory
 *
 * Note: The default Item menu remains unchanged and functional.
 *
 * Terms of Use:
 * Free for commercial and non-commercial use.
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 * Version 2.0.0
 * - Completely separate inventory system
 * - No modification to Scene_Item
 * - Added menu command option
 * - Added plugin command
 */

(() => {
    'use strict';

    const pluginName = 'CustomInventoryLayout';
    const params = PluginManager.parameters(pluginName);

    const config = {
        menuCommand: String(params['menuCommandName'] || 'Inventory'),
        showInMenu: String(params['showInMenu']) === 'true',
        layout: String(params['inventoryLayout'] || 'grid'),
        showIcons: String(params['showItemIcons']) === 'true',
        showQuantity: String(params['showItemQuantity']) === 'true',
        itemsPerRow: Number(params['itemsPerRow'] || 4),
        enableSearch: String(params['enableSearch']) === 'true',
        sortOptions: String(params['sortOptions']) === 'true',
        windowOpacity: Number(params['windowOpacity'] || 192),
        showStats: String(params['showItemStats']) === 'true',
        enableFavorites: String(params['enableFavorites']) === 'true'
    };
    PluginManager.registerCommand(pluginName, 'openInventory', args => {
        SceneManager.push(Scene_CustomInventory);
    });
    const favoriteItems = new Set();

    function Window_InventoryInfo() {
        this.initialize(...arguments);
    }

    Window_InventoryInfo.prototype = Object.create(Window_Base.prototype);
    Window_InventoryInfo.prototype.constructor = Window_InventoryInfo;

    Window_InventoryInfo.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this.opacity = config.windowOpacity;
        this._itemCount = 0;
        this._totalItems = 0;
        this.refresh();
    };

    Window_InventoryInfo.prototype.setItemCount = function(current, total) {
        if (this._itemCount !== current || this._totalItems !== total) {
            this._itemCount = current;
            this._totalItems = total;
            this.refresh();
        }
    };

    Window_InventoryInfo.prototype.refresh = function() {
        this.contents.clear();
        const width = this.innerWidth;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(config.menuCommand, 0, 0, 200, 'left');
        this.changeTextColor(ColorManager.normalColor());
        const countText = 'Items: ' + this._itemCount + ' / ' + this._totalItems;
        this.drawText(countText, 0, 0, width - 20, 'right');
        const goldText = TextManager.currencyUnit + ': ' + $gameParty.gold();
        this.drawText(goldText, 0, this.lineHeight(), width - 20, 'right');
    };

    function Window_InventoryCategory() {
        this.initialize(...arguments);
    }

    Window_InventoryCategory.prototype = Object.create(Window_HorzCommand.prototype);
    Window_InventoryCategory.prototype.constructor = Window_InventoryCategory;

    Window_InventoryCategory.prototype.initialize = function(rect) {
        Window_HorzCommand.prototype.initialize.call(this, rect);
        this.opacity = config.windowOpacity;
    };

    Window_InventoryCategory.prototype.maxCols = function() {
        return 4;
    };

    Window_InventoryCategory.prototype.makeCommandList = function() {
        this.addCommand('All', 'all');
        this.addCommand(TextManager.item, 'item');
        this.addCommand(TextManager.weapon, 'weapon');
        this.addCommand(TextManager.armor, 'armor');
        this.addCommand(TextManager.keyItem, 'keyItem');
    };

    Window_InventoryCategory.prototype.setItemWindow = function(itemWindow) {
        this._itemWindow = itemWindow;
        this.callUpdateHelp();
    };

    Window_InventoryCategory.prototype.update = function() {
        Window_HorzCommand.prototype.update.call(this);
        if (this._itemWindow) {
            this._itemWindow.setCategory(this.currentSymbol());
        }
    };

    function Window_InventorySortOptions() {
        this.initialize(...arguments);
    }

    Window_InventorySortOptions.prototype = Object.create(Window_Command.prototype);
    Window_InventorySortOptions.prototype.constructor = Window_InventorySortOptions;

    Window_InventorySortOptions.prototype.initialize = function(rect) {
        Window_Command.prototype.initialize.call(this, rect);
        this.opacity = config.windowOpacity;
        this.deactivate();
        this.hide();
    };

    Window_InventorySortOptions.prototype.makeCommandList = function() {
        this.addCommand('Default Order', 'default');
        this.addCommand('Sort by Name', 'name');
        this.addCommand('Sort by Type', 'type');
        this.addCommand('Sort by Quantity', 'quantity');
    };

    function Window_InventoryItemStats() {
        this.initialize(...arguments);
    }

    Window_InventoryItemStats.prototype = Object.create(Window_Base.prototype);
    Window_InventoryItemStats.prototype.constructor = Window_InventoryItemStats;

    Window_InventoryItemStats.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._item = null;
        this.opacity = config.windowOpacity;
    };

    Window_InventoryItemStats.prototype.setItem = function(item) {
        if (this._item !== item) {
            this._item = item;
            this.refresh();
        }
    };

    Window_InventoryItemStats.prototype.refresh = function() {
        this.contents.clear();
        if (!this._item) return;

        const lineHeight = this.lineHeight();
        let y = 0;
        if (config.showIcons) {
            this.drawIcon(this._item.iconIndex, 0, y);
        }
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(this._item.name, config.showIcons ? 40 : 0, y, this.innerWidth - 40);
        y += lineHeight;
        if (config.enableFavorites && favoriteItems.has(this._item.id)) {
            this.changeTextColor(ColorManager.textColor(14));
            this.drawText('★ Favorite', 0, y, this.innerWidth);
            y += lineHeight;
        }
        this.changeTextColor(ColorManager.normalColor());
        const descLines = Math.ceil(this.textSizeEx(this._item.description).height / lineHeight);
        this.drawTextEx(this._item.description, 0, y, this.innerWidth - 20);
        y += descLines * lineHeight + 10;
        if (config.showStats) {
            this.drawItemStats(y);
        }
    };

    Window_InventoryItemStats.prototype.drawItemStats = function(y) {
        const item = this._item;
        const lineHeight = this.lineHeight();
        this.changeTextColor(ColorManager.systemColor());
        this.drawText('Type:', 0, y, 100);
        this.changeTextColor(ColorManager.normalColor());

        let typeText = 'Item';
        if (DataManager.isWeapon(item)) typeText = 'Weapon';
        if (DataManager.isArmor(item)) typeText = 'Armor';
        this.drawText(typeText, 100, y, this.innerWidth - 100);
        y += lineHeight;
        if (DataManager.isItem(item)) {
            this.changeTextColor(ColorManager.systemColor());
            this.drawText('Quantity:', 0, y, 100);
            this.changeTextColor(ColorManager.normalColor());
            this.drawText($gameParty.numItems(item), 100, y, this.innerWidth - 100);
            y += lineHeight;
        }
        if (item.price > 0) {
            this.changeTextColor(ColorManager.systemColor());
            this.drawText('Value:', 0, y, 100);
            this.changeTextColor(ColorManager.normalColor());
            this.drawText(item.price + ' ' + TextManager.currencyUnit, 100, y, this.innerWidth - 100);
            y += lineHeight;
        }
        if (DataManager.isItem(item) && item.consumable) {
            this.changeTextColor(ColorManager.systemColor());
            this.drawText('Consumable:', 0, y, 100);
            this.changeTextColor(ColorManager.normalColor());
            this.drawText('Yes', 100, y, this.innerWidth - 100);
            y += lineHeight;
        }
        if (DataManager.isWeapon(item)) {
            this.drawWeaponStats(item, y);
        } else if (DataManager.isArmor(item)) {
            this.drawArmorStats(item, y);
        }
    };

    Window_InventoryItemStats.prototype.drawWeaponStats = function(weapon, y) {
        const lineHeight = this.lineHeight();

        this.changeTextColor(ColorManager.systemColor());
        this.drawText('Attack:', 0, y, 100);
        this.changeTextColor(ColorManager.normalColor());
        this.drawText(weapon.params[2], 100, y, this.innerWidth - 100);
        y += lineHeight;

        if (weapon.wtypeId) {
            this.changeTextColor(ColorManager.systemColor());
            this.drawText('Type ID:', 0, y, 100);
            this.changeTextColor(ColorManager.normalColor());
            this.drawText(weapon.wtypeId, 100, y, this.innerWidth - 100);
        }
    };

    Window_InventoryItemStats.prototype.drawArmorStats = function(armor, y) {
        const lineHeight = this.lineHeight();

        this.changeTextColor(ColorManager.systemColor());
        this.drawText('Defense:', 0, y, 100);
        this.changeTextColor(ColorManager.normalColor());
        this.drawText(armor.params[3], 100, y, this.innerWidth - 100);
        y += lineHeight;

        this.changeTextColor(ColorManager.systemColor());
        this.drawText('M.Defense:', 0, y, 100);
        this.changeTextColor(ColorManager.normalColor());
        this.drawText(armor.params[5], 100, y, this.innerWidth - 100);
    };

    function Window_InventoryItemList() {
        this.initialize(...arguments);
    }

    Window_InventoryItemList.prototype = Object.create(Window_Selectable.prototype);
    Window_InventoryItemList.prototype.constructor = Window_InventoryItemList;

    Window_InventoryItemList.prototype.initialize = function(rect) {
        Window_Selectable.prototype.initialize.call(this, rect);
        this._category = 'none';
        this._data = [];
        this._searchFilter = '';
        this._sortMode = 'default';
        this.opacity = config.windowOpacity;
        this.refresh();
    };

    Window_InventoryItemList.prototype.maxCols = function() {
        if (config.layout === 'grid') {
            return config.itemsPerRow;
        } else if (config.layout === 'list') {
            return 1;
        } else {
            return 2;
        }
    };

    Window_InventoryItemList.prototype.colSpacing = function() {
        return config.layout === 'grid' ? 8 : 16;
    };

    Window_InventoryItemList.prototype.maxItems = function() {
        return this._data ? this._data.length : 1;
    };

    Window_InventoryItemList.prototype.item = function() {
        return this.itemAt(this.index());
    };

    Window_InventoryItemList.prototype.itemAt = function(index) {
        return this._data && index >= 0 ? this._data[index] : null;
    };

    Window_InventoryItemList.prototype.isEnabled = function(item) {
        return $gameParty.canUse(item);
    };

    Window_InventoryItemList.prototype.makeItemList = function() {
        this._data = $gameParty.allItems().filter(item => this.includes(item));

        if (config.sortOptions && this._sortMode !== 'default') {
            this.sortItemList();
        }

        if (config.enableFavorites) {
            this._data.sort((a, b) => {
                const aFav = favoriteItems.has(a.id) ? 1 : 0;
                const bFav = favoriteItems.has(b.id) ? 1 : 0;
                return bFav - aFav;
            });
        }
    };

    Window_InventoryItemList.prototype.includes = function(item) {
        if (!item) return false;
        switch (this._category) {
            case 'item':
                if (!DataManager.isItem(item) || item.itypeId === 2) return false;
                break;
            case 'weapon':
                if (!DataManager.isWeapon(item)) return false;
                break;
            case 'armor':
                if (!DataManager.isArmor(item)) return false;
                break;
            case 'keyItem':
                if (!DataManager.isItem(item) || item.itypeId !== 2) return false;
                break;
        }
        if (config.enableSearch && this._searchFilter) {
            return item.name.toLowerCase().includes(this._searchFilter);
        }

        return true;
    };

    Window_InventoryItemList.prototype.sortItemList = function() {
        switch (this._sortMode) {
            case 'name':
                this._data.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'quantity':
                this._data.sort((a, b) => $gameParty.numItems(b) - $gameParty.numItems(a));
                break;
            case 'type':
                this._data.sort((a, b) => {
                    if (DataManager.isItem(a) && DataManager.isItem(b)) {
                        return a.itypeId - b.itypeId;
                    }
                    return 0;
                });
                break;
        }
    };

    Window_InventoryItemList.prototype.setCategory = function(category) {
        if (this._category !== category) {
            this._category = category;
            this.refresh();
            this.scrollTo(0, 0);
        }
    };

    Window_InventoryItemList.prototype.setSearchFilter = function(text) {
        this._searchFilter = text.toLowerCase();
        this.refresh();
        this.select(0);
    };

    Window_InventoryItemList.prototype.setSortMode = function(mode) {
        this._sortMode = mode;
        this.refresh();
        this.select(0);
    };

    Window_InventoryItemList.prototype.toggleFavorite = function() {
        const item = this.item();
        if (item) {
            if (favoriteItems.has(item.id)) {
                favoriteItems.delete(item.id);
            } else {
                favoriteItems.add(item.id);
            }
            this.refresh();
            return true;
        }
        return false;
    };

    Window_InventoryItemList.prototype.drawItem = function(index) {
        const item = this.itemAt(index);
        if (item) {
            const rect = this.itemLineRect(index);
            this.changePaintOpacity(this.isEnabled(item));

            if (config.layout === 'grid') {
                this.drawGridItem(item, rect);
            } else if (config.layout === 'list') {
                this.drawListItem(item, rect);
            } else {
                this.drawHybridItem(item, rect);
            }
            if (config.enableFavorites && favoriteItems.has(item.id)) {
                this.changeTextColor(ColorManager.textColor(14));
                this.drawText('★', rect.x, rect.y, rect.width, 'right');
            }

            this.changePaintOpacity(1);
        }
    };

    Window_InventoryItemList.prototype.drawGridItem = function(item, rect) {
        const iconY = rect.y + (rect.height - ImageManager.iconHeight) / 2;
        const iconX = rect.x + (rect.width - ImageManager.iconWidth) / 2;

        if (config.showIcons) {
            this.drawIcon(item.iconIndex, iconX, iconY);
        }

        if (config.showQuantity) {
            this.resetTextColor();
            const numWidth = this.textWidth('000');
            const quantityX = rect.x + rect.width - numWidth - 4;
            const quantityY = rect.y + rect.height - this.lineHeight();
            this.drawItemNumber(item, quantityX, quantityY, numWidth);
        }
    };

    Window_InventoryItemList.prototype.drawListItem = function(item, rect) {
        if (config.showIcons) {
            this.drawIcon(item.iconIndex, rect.x, rect.y + 2);
        }

        this.resetTextColor();
        const iconWidth = config.showIcons ? ImageManager.iconWidth + 4 : 0;
        const textWidth = rect.width - iconWidth - this.textWidth('000') - 20;

        this.drawText(item.name, rect.x + iconWidth, rect.y, textWidth);

        if (config.showQuantity) {
            const numWidth = this.textWidth('000');
            this.drawItemNumber(item, rect.x + rect.width - numWidth - 20, rect.y, numWidth);
        }
    };

    Window_InventoryItemList.prototype.drawHybridItem = function(item, rect) {
        if (config.showIcons) {
            this.drawIcon(item.iconIndex, rect.x + 4, rect.y + 2);
        }

        this.resetTextColor();
        const iconWidth = config.showIcons ? ImageManager.iconWidth + 8 : 0;
        const nameWidth = rect.width - iconWidth - 50;

        this.drawText(item.name, rect.x + iconWidth, rect.y, nameWidth);

        if (config.showQuantity) {
            this.drawItemNumber(item, rect.x + rect.width - 40, rect.y, 40);
        }
    };

    Window_InventoryItemList.prototype.drawItemNumber = function(item, x, y, width) {
        this.drawText(':', x, y, width - this.textWidth('00'), 'right');
        this.drawText($gameParty.numItems(item), x, y, width, 'right');
    };

    Window_InventoryItemList.prototype.refresh = function() {
        this.makeItemList();
        Window_Selectable.prototype.refresh.call(this);
    };

    Window_InventoryItemList.prototype.updateHelp = function() {
        this.setHelpWindowItem(this.item());
    };

    function Scene_CustomInventory() {
        this.initialize(...arguments);
    }

    Scene_CustomInventory.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_CustomInventory.prototype.constructor = Scene_CustomInventory;

    Scene_CustomInventory.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
    };

    Scene_CustomInventory.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createInfoWindow();
        this.createCategoryWindow();
        if (config.sortOptions) {
            this.createSortWindow();
        }
        this.createItemWindow();
        if (config.showStats) {
            this.createStatsWindow();
        }
        this.createHelpWindow();
    };

    Scene_CustomInventory.prototype.createHelpWindow = function() {
        const rect = this.helpWindowRect();
        this._helpWindow = new Window_Help(rect);
        this._helpWindow.opacity = config.windowOpacity;
        this.addWindow(this._helpWindow);
    };

    Scene_CustomInventory.prototype.helpWindowRect = function() {
        const wx = 0;
        const wy = Graphics.boxHeight - this.calcWindowHeight(2, false);
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(2, false);
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_CustomInventory.prototype.createInfoWindow = function() {
        const rect = this.infoWindowRect();
        this._infoWindow = new Window_InventoryInfo(rect);
        this.addWindow(this._infoWindow);
    };

    Scene_CustomInventory.prototype.infoWindowRect = function() {
        const wx = 0;
        const wy = this.mainAreaTop();
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(2, false);
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_CustomInventory.prototype.createCategoryWindow = function() {
        const rect = this.categoryWindowRect();
        this._categoryWindow = new Window_InventoryCategory(rect);
        this._categoryWindow.setHandler('ok', this.onCategoryOk.bind(this));
        this._categoryWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._categoryWindow);
    };

    Scene_CustomInventory.prototype.categoryWindowRect = function() {
        const wx = 0;
        const wy = this._infoWindow.y + this._infoWindow.height;
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(1, true);
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_CustomInventory.prototype.createSortWindow = function() {
        const rect = this.sortWindowRect();
        this._sortWindow = new Window_InventorySortOptions(rect);
        this._sortWindow.setHandler('default', this.onSortOk.bind(this));
        this._sortWindow.setHandler('name', this.onSortOk.bind(this));
        this._sortWindow.setHandler('type', this.onSortOk.bind(this));
        this._sortWindow.setHandler('quantity', this.onSortOk.bind(this));
        this._sortWindow.setHandler('cancel', this.onSortCancel.bind(this));
        this.addWindow(this._sortWindow);
    };

    Scene_CustomInventory.prototype.sortWindowRect = function() {
        const ww = 240;
        const wh = this.calcWindowHeight(4, true);
        const wx = Graphics.boxWidth - ww;
        const wy = this._categoryWindow.y + this._categoryWindow.height;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_CustomInventory.prototype.createItemWindow = function() {
        const rect = this.itemWindowRect();
        this._itemWindow = new Window_InventoryItemList(rect);
        this._itemWindow.setHelpWindow(this._helpWindow);
        this._itemWindow.setHandler('ok', this.onItemOk.bind(this));
        this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
        this.addWindow(this._itemWindow);
        this._categoryWindow.setItemWindow(this._itemWindow);
    };

    Scene_CustomInventory.prototype.itemWindowRect = function() {
        const wx = 0;
        const wy = this._categoryWindow.y + this._categoryWindow.height;
        const ww = config.showStats ? Graphics.boxWidth * 0.6 : Graphics.boxWidth;
        const wh = Graphics.boxHeight - wy - this._helpWindow.height;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_CustomInventory.prototype.createStatsWindow = function() {
        const rect = this.statsWindowRect();
        this._statsWindow = new Window_InventoryItemStats(rect);
        this.addWindow(this._statsWindow);
    };

    Scene_CustomInventory.prototype.statsWindowRect = function() {
        const ww = Graphics.boxWidth * 0.4;
        const wx = Graphics.boxWidth - ww;
        const wy = this._itemWindow.y;
        const wh = this._itemWindow.height;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_CustomInventory.prototype.onCategoryOk = function() {
        this._itemWindow.activate();
        this._itemWindow.select(0);
    };

    Scene_CustomInventory.prototype.onItemOk = function() {
        $gameParty.setLastItem(this.item());
        this.determineItem();
    };

    Scene_CustomInventory.prototype.onItemCancel = function() {
        this._itemWindow.deselect();
        this._categoryWindow.activate();
    };

    Scene_CustomInventory.prototype.determineItem = function() {
        const item = this.item();
        const action = new Game_Action($gameParty.leader());
        action.setItemObject(item);
        if (action.testApply($gameParty.leader())) {
            this.useItem();
        } else {
            SoundManager.playBuzzer();
            this._itemWindow.activate();
        }
    };

    Scene_CustomInventory.prototype.useItem = function() {
        this.playSeForItem();
        $gameParty.leader().useItem(this.item());
        this.applyItem();
        this.checkCommonEvent();
        this.checkGameover();
        this._itemWindow.refresh();
        this.updateItemCount();
    };

    Scene_CustomInventory.prototype.applyItem = function() {
        const action = new Game_Action($gameParty.leader());
        action.setItemObject(this.item());
        action.apply($gameParty.leader());
        action.applyGlobal();
    };

    Scene_CustomInventory.prototype.checkCommonEvent = function() {
        if ($gameTemp.isCommonEventReserved()) {
            SceneManager.goto(Scene_Map);
        }
    };

    Scene_CustomInventory.prototype.playSeForItem = function() {
        SoundManager.playUseItem();
    };

    Scene_CustomInventory.prototype.item = function() {
        return this._itemWindow.item();
    };

    Scene_CustomInventory.prototype.onSortOk = function() {
        const symbol = this._sortWindow.currentSymbol();
        this._itemWindow.setSortMode(symbol);
        this._sortWindow.deactivate();
        this._sortWindow.hide();
        this._itemWindow.activate();
        this.updateItemCount();
    };

    Scene_CustomInventory.prototype.onSortCancel = function() {
        this._sortWindow.deactivate();
        this._sortWindow.hide();
        this._itemWindow.activate();
    };

    Scene_CustomInventory.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        if (config.showStats && this._statsWindow && this._itemWindow.active) {
            this._statsWindow.setItem(this._itemWindow.item());
        }
        this.updateItemCount();
        if (config.sortOptions && this._itemWindow.active && Input.isTriggered('tab')) {
            this._itemWindow.deactivate();
            this._sortWindow.show();
            this._sortWindow.activate();
            this._sortWindow.select(0);
        }
        if (config.enableFavorites && this._itemWindow.active) {
            if (Input.isPressed('shift') && Input.isTriggered('ok')) {
                this._itemWindow.toggleFavorite();
                if (this._statsWindow) {
                    this._statsWindow.refresh();
                }
            }
        }
    };

    Scene_CustomInventory.prototype.updateItemCount = function() {
        if (this._infoWindow && this._itemWindow) {
            const current = this._itemWindow.maxItems();
            const total = $gameParty.allItems().length;
            this._infoWindow.setItemCount(current, total);
        }
    };

    if (config.showInMenu) {
        const _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
        Window_MenuCommand.prototype.addOriginalCommands = function() {
            _Window_MenuCommand_addOriginalCommands.call(this);
            this.addCommand(config.menuCommand, 'customInventory', true);
        };

        const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
        Scene_Menu.prototype.createCommandWindow = function() {
            _Scene_Menu_createCommandWindow.call(this);
            this._commandWindow.setHandler('customInventory', this.commandCustomInventory.bind(this));
        };

        Scene_Menu.prototype.commandCustomInventory = function() {
            SceneManager.push(Scene_CustomInventory);
        };
    }

})();


