
/*:
 * @target MZ
 * @plugindesc Transforms the Item menu into a modern grid-based layout with visual flair
 * @author Leandro Nunes
 * @url www.1337games.com.br
 *
 * @param gridColumns
 * @text Colunas da Grade
 * @type number
 * @min 2
 * @max 6
 * @default 4
 * @desc Número de colunas na grade de itens
 *
 * @param showItemPreview
 * @text Mostrar Prévia do Item
 * @type boolean
 * @default true
 * @desc Mostra um painel grande de prévia para o item selecionado
 *
 * @param animateSelection
 * @text Animar Seleção
 * @type boolean
 * @default true
 * @desc Anima a seleção de itens com transições suaves
 *
 * @param categoryStyle
 * @text Estilo das Categorias
 * @type select
 * @option Tabs
 * @option Icons
 * @default Tabs
 * @desc Estilo da seleção de categorias
 *
 * @help
 * ============================================================================
 * Modern Grid Item Menu
 * ============================================================================
 * 
 * This plugin completely redesigns the Item menu with:
 * - Beautiful grid-based layout showing multiple items at once
 * - Large preview panel with detailed item information
 * - Smooth animations and modern visual effects
 * - Icon-based categories for quick navigation
 * - Rarity-based color coding for items
 * - Quantity badges and visual indicators
 * 
 * The plugin automatically detects item types and displays them with
 * appropriate styling and information.
 * 
 * No additional configuration needed - just install and enjoy!
 * 
 * ============================================================================
 */

(() => {
    'use strict';

    const pluginName = 'ModernGridItemMenu';
    const parameters = PluginManager.parameters(pluginName);
    const gridColumns = Number(parameters['gridColumns'] || 4);
    const showItemPreview = parameters['showItemPreview'] === 'true';
    const animateSelection = parameters['animateSelection'] === 'true';
    const categoryStyle = parameters['categoryStyle'] || 'Tabs';

    const _Scene_Item_create = Scene_Item.prototype.create;
    Scene_Item.prototype.create = function() {
        _Scene_Item_create.call(this);
        this.createModernLayout();
    };

    Scene_Item.prototype.createModernLayout = function() {
        this._categoryWindow.y = 0;
        this._categoryWindow.height = 72;

        if (showItemPreview) {
            const gridWidth = Graphics.boxWidth * 0.6;
            this._itemWindow.x = 0;
            this._itemWindow.y = 72;
            this._itemWindow.width = gridWidth;
            this._itemWindow.height = Graphics.boxHeight - 72;

            this.createPreviewWindow(gridWidth);
        } else {
            this._itemWindow.y = 72;
            this._itemWindow.height = Graphics.boxHeight - 72;
        }
    };

    Scene_Item.prototype.createPreviewWindow = function(gridWidth) {
        const rect = new Rectangle(
            gridWidth,
            72,
            Graphics.boxWidth - gridWidth,
            Graphics.boxHeight - 72
        );
        this._previewWindow = new Window_ItemPreview(rect);
        this._itemWindow.setPreviewWindow(this._previewWindow);
        this.addWindow(this._previewWindow);
    };

    Window_ItemCategory.prototype.maxCols = function() {
        return 4;
    };

    Window_ItemCategory.prototype.itemHeight = function() {
        return 48;
    };

    const _Window_ItemCategory_drawItem = Window_ItemCategory.prototype.drawItem;
    Window_ItemCategory.prototype.drawItem = function(index) {
        const rect = this.itemLineRect(index);
        const symbol = this.commandSymbol(index);
        const iconIndex = this.getCategoryIcon(symbol);
        const text = this.commandName(index);
        this.resetTextColor();

        if (index === this.index()) {
            this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, 'rgba(255, 255, 255, 0.1)');
            this.contents.fillRect(rect.x, rect.y + rect.height - 3, rect.width, 3, this.systemColor());
        }
        const iconY = rect.y + (rect.height - ImageManager.iconHeight) / 2;
        const iconX = rect.x + 8;
        this.drawIcon(iconIndex, iconX, iconY);
        const textX = iconX + ImageManager.iconWidth + 8;
        const textY = rect.y + (rect.height - this.lineHeight()) / 2;
        this.contents.fontSize = 24;
        this.drawText(text, textX, textY, rect.width - textX + rect.x, 'left');
        this.contents.fontSize = $gameSystem.mainFontSize();
    };

    Window_ItemCategory.prototype.getCategoryIcon = function(symbol) {
        const icons = {
            item: 176,
            weapon: 97,
            armor: 135,
            keyItem: 195
        };
        return icons[symbol] || 0;
    };

    Window_ItemList.prototype.maxCols = function() {
        return gridColumns;
    };

    Window_ItemList.prototype.itemHeight = function() {
        return 120;
    };

    Window_ItemList.prototype.setPreviewWindow = function(previewWindow) {
        this._previewWindow = previewWindow;
    };

    const _Window_ItemList_select = Window_ItemList.prototype.select;
    Window_ItemList.prototype.select = function(index) {
        _Window_ItemList_select.call(this, index);
        if (this._previewWindow) {
            this._previewWindow.setItem(this.item());
        }
    };

    Window_ItemList.prototype.drawItem = function(index) {
        const item = this.itemAt(index);
        if (item) {
            const rect = this.itemRect(index);
            this.drawItemCard(item, rect, index);
        }
    };

    Window_ItemList.prototype.drawItemCard = function(item, rect, index) {
        const padding = 4;
        const x = rect.x + padding;
        const y = rect.y + padding;
        const w = rect.width - padding * 2;
        const h = rect.height - padding * 2;
        const rarityColor = this.getItemRarityColor(item);
        this.contents.fillRect(x, y, w, h, 'rgba(0, 0, 0, 0.3)');
        this.contents.fillRect(x, y, w, 3, rarityColor);
        if (index === this.index() && animateSelection) {
            const time = Graphics.frameCount;
            const pulse = Math.sin(time * 0.1) * 0.1 + 0.9;
            this.contents.fillRect(x, y, w, h, `rgba(255, 255, 255, ${0.15 * pulse})`);
        }
        const iconSize = 48;
        const iconX = x + (w - iconSize) / 2;
        const iconY = y + 8;
        this.drawLargeIcon(item.iconIndex, iconX, iconY, iconSize);
        this.resetTextColor();
        this.contents.fontSize = 18;
        this.drawText(item.name, x, y + 60, w, 'center');
        this.contents.fontSize = $gameSystem.mainFontSize();
        const numberWidth = 40;
        const numberX = x + w - numberWidth - 4;
        const numberY = y + h - 28;
        this.drawItemQuantity(item, numberX, numberY, numberWidth);
    };

    Window_ItemList.prototype.drawLargeIcon = function(iconIndex, x, y, size) {
        const bitmap = ImageManager.loadSystem('IconSet');
        const pw = ImageManager.iconWidth;
        const ph = ImageManager.iconHeight;
        const sx = (iconIndex % 16) * pw;
        const sy = Math.floor(iconIndex / 16) * ph;
        this.contents.blt(bitmap, sx, sy, pw, ph, x, y, size, size);
    };

    Window_ItemList.prototype.drawItemQuantity = function(item, x, y, width) {
        const number = $gameParty.numItems(item);
        this.contents.fillRect(x - 2, y - 2, width + 4, 24, 'rgba(0, 0, 0, 0.5)');
        this.changeTextColor(this.systemColor());
        this.contents.fontSize = 20;
        this.drawText('×' + number, x, y, width, 'right');
        this.contents.fontSize = $gameSystem.mainFontSize();
        this.resetTextColor();
    };

    Window_ItemList.prototype.getItemRarityColor = function(item) {
        if (item.itypeId === 2) {
            return 'rgba(255, 215, 0, 0.8)';
        } else if (item.price > 5000) {
            return 'rgba(138, 43, 226, 0.8)';
        } else if (item.price > 1000) {
            return 'rgba(30, 144, 255, 0.8)';
        } else if (item.price > 100) {
            return 'rgba(50, 205, 50, 0.8)';
        }
        return 'rgba(169, 169, 169, 0.8)';
    };

    function Window_ItemPreview() {
        this.initialize(...arguments);
    }

    Window_ItemPreview.prototype = Object.create(Window_Base.prototype);
    Window_ItemPreview.prototype.constructor = Window_ItemPreview;

    Window_ItemPreview.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._item = null;
    };

    Window_ItemPreview.prototype.setItem = function(item) {
        if (this._item !== item) {
            this._item = item;
            this.refresh();
        }
    };

    Window_ItemPreview.prototype.refresh = function() {
        this.contents.clear();
        if (this._item) {
            this.drawItemPreview(this._item);
        }
    };

    Window_ItemPreview.prototype.drawItemPreview = function(item) {
        const padding = 20;
        let y = padding;
        const iconSize = 96;
        const iconX = (this.contents.width - iconSize) / 2;
        this.drawLargeIcon(item.iconIndex, iconX, y, iconSize);
        y += iconSize + 20;
        this.resetTextColor();
        this.contents.fontSize = 28;
        this.drawText(item.name, 0, y, this.contents.width, 'center');
        this.contents.fontSize = $gameSystem.mainFontSize();
        y += 40;
        const typeText = this.getItemTypeText(item);
        this.changeTextColor(this.systemColor());
        this.drawText(typeText, 0, y, this.contents.width, 'center');
        this.resetTextColor();
        y += 40;
        this.drawTextEx(item.description, padding, y, this.contents.width - padding * 2);
        y += this.calcTextHeight(item.description, false) + 30;
        this.drawItemStats(item, padding, y);
    };

    Window_ItemPreview.prototype.drawItemStats = function(item, x, y) {
        if (item.price > 0) {
            this.changeTextColor(this.systemColor());
            this.drawText('Value:', x, y, 120);
            this.resetTextColor();
            this.drawText(item.price + ' ' + TextManager.currencyUnit, x + 120, y, 200);
            y += 36;
        }

        if (item.consumable) {
            this.changeTextColor(this.systemColor());
            this.drawText('Type:', x, y, 120);
            this.resetTextColor();
            this.drawText('Consumable', x + 120, y, 200);
            y += 36;
        }
        const quantity = $gameParty.numItems(item);
        this.changeTextColor(this.systemColor());
        this.drawText('Owned:', x, y, 120);
        this.resetTextColor();
        this.drawText(quantity.toString(), x + 120, y, 200);
    };

    Window_ItemPreview.prototype.getItemTypeText = function(item) {
        if (item.itypeId === 2) {
            return '★ Key Item ★';
        } else if (item.price > 5000) {
            return '★★★ Rare ★★★';
        } else if (item.price > 1000) {
            return '★★ Uncommon ★★';
        }
        return '★ Common ★';
    };

    Window_ItemPreview.prototype.drawLargeIcon = function(iconIndex, x, y, size) {
        const bitmap = ImageManager.loadSystem('IconSet');
        const pw = ImageManager.iconWidth;
        const ph = ImageManager.iconHeight;
        const sx = (iconIndex % 16) * pw;
        const sy = Math.floor(iconIndex / 16) * ph;
        this.contents.blt(bitmap, sx, sy, pw, ph, x, y, size, size);
    };

    Window_ItemPreview.prototype.calcTextHeight = function(text, all) {
        return Window_Base.prototype.calcTextHeight.call(this, text, all);
    };

})();


