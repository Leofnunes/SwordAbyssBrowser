
/*:
* @plugindesc Sistema customizado de bestiário que mostra Status do Inimigo, Resistência Mágica e Recompensas.
* @author Leandro Nunes
* @url www.1337games.com.br
*
* @param [Configurações Gerais]
* @default 
* 
* @param Disponível no Menu Principal
* @desc É possível acessar o bestiário pelo menu?
* 1 - Sim, 0 - Não
* @default 1
*
* @param Mostrar Informações
* @desc Quando revelar as informações do inimigo no bestiário?
* 0 - Desligado, 1 - Ao matar, 2 - Ao encontra-lo
* @default 1
*
* @param Mostrar todos os inimigos 
* @desc Mostrar apenas inimigo derrotado ou todos?
* 1 - Inimigo derrotado, 2 - Todos
* @default 1
*
* @param Nome do comando no menu principal
* @desc Forma como o bestiário será chamado no menu principal.
* @default Bestiário
* 
* @param Inimigo desconhecido
* @desc Como será mostrado o nome de inimigos desconhecidos?
* @default -------
*
* @param  
* @default 
* 
* @param [Layout - Geral]
* @default
*
* @param Lado da Lista
* @desc Em qual lado a lista e imagem deve ser mostrada?
* LEFT - lado esquerdo, RIGHT - lado direito.
* @default RIGHT
*
* @param  
* @default
* 
* @param [Configuração do Painel]
* @default 
*
* @param [Parâmetros - Superior]
* @default
*
* @param Texto dos parâmetros
* @desc Como será chamado os parâmetros no bestiário?
* @default Atributos
*
* @param Modo dos parâmetros
* @desc Mostrar (SHOW) parâmetros? Ou esconder (HIDE) os 
* parâmetros listado abaixo?
* @default HIDE
*
* @param Lista de parâmetros
* @desc Parâmetros que serão mantidos ou escondidos.
* Exemplo: 1 2 5 6 9
* @default 6 7
*
* @param  
* @default
* 
* @param [Resistências Mágicas - superior]
* @default
*
* @param Texto de resistencias mágicas
* @desc Qual nome será mostrado para resistências mágicas?
* @default Resistencia Magica
*
* @param Elementos listados
* @desc Mostrar (SHOW) apenas elementos listados abaixo? Ou esconder (HIDE) 
* apenas os elementos listados abaixo.
* @default HIDE
*
* @param Lista de elementos
* @desc Elementos que serão mostrados ou escondidos, como citado acima.
* Exemplo: 1 2 5 6 9
* @default 1 9
*
* @param
* @default 
* 
* @param [Recompensa - Fundo]
* @default
*
* @param Texto Recompensa
* @desc Qual nome utilizar para recompensas (loot) no bestiario?
* @default Recompensas
*
* @param Nome da moeda
* @desc Qual nome utilizar para moeda (dinheiro) no bestiário?
* @default Moedas de Ouro
*
* @param Texto de items obtidos
* @desc Que nome devo usar para os itens obtidos no bestiário?
* @default Items obtidos
* 
* @help Version 1.1
* Plugin criado para jogos da 1337Games, código escrito por
* Leandro Nunes. Assim como outros plugins escritos por mim,
* esse foi completamente escrito do zero, com o objetivo 
* de manter a originalidade dos nossos jogos.
*
* MODIFICADO: Agora mostra stats ajustados pela dificuldade selecionada!
*
* Campos de informação dos inimigos:
* <b_hidden> - Não listado no bestiário
*
* Plugin Commands:
*   Bestiary open		# Abre a janela de bestiário
*   Bestiary clear  		# Esvazia as informações listadas no bestiário
*   Bestiary fill		# Revela todas as informações do bestiário
*   Bestiary discover ID # Revela um inimigo no bestiário com ID listada
*   Bestiary remove ID   # Apaga informação de um inimigo com ID listada
*
* Only if Bestiary can be accessed from Menu:
*   Bestiary disable 	# Desabilita o bestiário no menu
*   Bestiary enable 		# Ativa o bestiário no Menu.
*/

(function() {

	var parameters = PluginManager.parameters('CustomBestiary');
	function getParam(name, defaultValue) {
		var value = parameters[name];
		return value !== undefined ? value : defaultValue;
	}
	var isInMenu = Number(getParam('Is In Menu', '1'));
	var revealOnKill = Number(getParam('Show Data', '1'));
	var showEntriesMode = Number(getParam('Show All Entries', '1'));
	var BestiaryCommandText = String(getParam('Command Name', 'Bestiary'));
	var unknownText = String(getParam('Unknown Enemy', '------------------'));
	var BestiarySide = String(getParam('List Side', 'RIGHT'));
	var paramsText = String(getParam('Parameters Text', 'Atributos'));
	var paramsMode = String(getParam('Parameters Mode', 'HIDE'));
	var paramsList = String(getParam('Parameters List', '6 7'));
	var resistancesText = String(getParam('Resistances Text', 'Resistencias'));
	var elementMode = String(getParam('Element Mode', 'HIDE'));
	var elementList = String(getParam('Element List', '1 9'));
	var RecompensaText = String(getParam('Recompensa Text', 'Recompensa'));
	var itemDropsText = String(getParam('Item Drops Text', 'Loots'));
	var currencyText = String(getParam('Currency Text', 'Ouro'));

	var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function(command, args) {
		_Game_Interpreter_pluginCommand.call(this, command, args);
		if (command === 'Bestiary') {
			switch(args[0])
			{
				case 'open':
					SceneManager.push(Scene_Bestiary);
					break;
				case 'clear':
					$gameSystem.BestiaryClear();
					break;
				case 'fill':
					$gameSystem.BestiaryFill();
					break;
				case 'discover':
					$gameSystem.BestiaryDiscover(Number(args[1]), true);
					break;
				case 'remove':
					$gameSystem.BestiaryHide(Number(args[1]));
					break;
				case 'disable':
					$gameSystem.BestiaryEnable(false);
					break;
				case 'enable':
					$gameSystem.BestiaryEnable(true);
					break;
			}
		}
	};

	function Scene_Bestiary() {
		this.initialize.apply(this, arguments);
	}

	Scene_Bestiary.prototype = Object.create(Scene_Base.prototype);
	Scene_Bestiary.prototype.constructor = Scene_Bestiary;

	Scene_Bestiary.prototype.initialize = function() {
		Scene_Base.prototype.initialize.call(this);
	};

	Scene_Bestiary.prototype.create = function() {
		Scene_Base.prototype.create.call(this);
    	this.createBackground();
		this.createWindowLayer();
		this.createWindows();
	};

	Scene_Bestiary.prototype.createBackground = function() {
	    this._backgroundSprite = new Sprite();
	    this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
	    this.addChild(this._backgroundSprite);
	};

	Scene_Bestiary.prototype.createWindows = function() {
		this.createSelectionWindow();
		this.createDescriptionWindow();
		this.createInfoWindow();
		this._selectionWindow.descWindow = this._descriptionWindow;
		this._selectionWindow.dataWindow = this._infoWindow;
		this._selectionWindow.activate();
	};

	Scene_Bestiary.prototype.createInfoWindow = function() {
		var ww = Graphics.boxWidth-this._selectionWindow.width;
		var wx = BestiarySide === 'LEFT' ? Graphics.boxWidth-ww : 0;
		this._infoWindow = new Window_MonsterInfo(new Rectangle(wx, 0, ww, Graphics.boxHeight));
		this.addWindow(this._infoWindow);
	};

	Scene_Bestiary.prototype.createDescriptionWindow = function() {
		var ww = Graphics.boxHeight/1.8;
		var wh = Graphics.boxHeight/2;
		var wx = BestiarySide === 'LEFT' ? 0 : Graphics.boxWidth - ww;
		var wy = Graphics.boxHeight/2;
		this._descriptionWindow = new Window_MonsterDescription(new Rectangle(wx, wy, ww, wh));
		this.addWindow(this._descriptionWindow);
	};

	Scene_Bestiary.prototype.createSelectionWindow = function() {
		var ww = Graphics.boxHeight/1.8;
		var wh = Graphics.boxHeight/2;
		var wx = BestiarySide === 'LEFT' ? 0 : Graphics.boxWidth - ww;
		var wy = 0;
		this._selectionWindow = new Window_MonsterList(new Rectangle(wx, wy, ww, wh));
		this._selectionWindow.setHandler('cancel', this.popScene.bind(this));
		this.addWindow(this._selectionWindow);
	};

	function Window_MonsterInfo() {
		this.initialize.apply(this, arguments);
	}

	Window_MonsterInfo.prototype = Object.create(Window_Selectable.prototype);
	Window_MonsterInfo.prototype.constructor = Window_MonsterInfo;

	Window_MonsterInfo.prototype.initialize = function(rect) {
		Window_Selectable.prototype.initialize.call(this, rect);
		this.refresh();
	};

	Window_MonsterInfo.prototype.refresh = function() {
		this.contents.clear();

    	if (!this._enemyId || !$gameSystem.isEnemyRevealed(this._enemyId))
			return;
		var topPanels = ['PARAMETERS', 'RESISTANCES'];
		for (var i = 0; i < topPanels.length; i++)
		{
			var rect = this.createPanelRect(topPanels.length, i, true);
			if (i > 0) {
				this.drawVertLine(rect.x-3, rect.y + 10, rect.height - 20);
			}

			switch(topPanels[i])
			{
				case "PARAMETERS":
					this.drawParametersTopPanel(rect);
				break;
				case "RESISTANCES":
					this.drawResistancesTopPanel(rect);
				break;
			}
		}
		var separatorY = this.contents.height * 0.56;
		this.drawHorzLine(10, separatorY, this.contents.width-20);
		var RecompensaRect = this.createPanelRect(1, 0, false);
		this.drawRecompensaBottomPanel(RecompensaRect);
	};

	Window_MonsterInfo.prototype.drawRecompensaBottomPanel = function(rect)
	{
		var enemy = $dataEnemies[this._enemyId];

		this.makeFontBigger();
		this.drawText(RecompensaText, rect.x+5, rect.y+5, rect.width);
		this.makeFontSmaller();

		var x = rect.x + 20;
		var h = rect.y + 50;
		var w = rect.width - 40;
		var modifiedGold = enemy.gold;
		var modifiedExp = enemy.exp;

		if ($gameVariables) {
			var diff = $gameVariables.value(1);
			if (diff === 3) {
				modifiedGold = Math.floor(modifiedGold * 0.80);
				modifiedExp = Math.floor(modifiedExp * 0.85);
			}
		}
		this.changeTextColor(this.systemColor());
		this.drawText(TextManager.exp, x, h, w * 0.45, 'left');
		this.resetTextColor();
		this.drawText(modifiedExp, x, h, w * 0.45, 'right');
		this.changeTextColor(this.systemColor());
		this.drawText(currencyText, x + w * 0.5, h, w * 0.45, 'left');
		this.resetTextColor();
		this.drawText(modifiedGold, x + w * 0.5, h, w * 0.45, 'right');

		h += this.lineHeight() * 2;
		this.changeTextColor(this.systemColor());
		this.drawText(itemDropsText, x, h, w, 'left');
		this.resetTextColor();

		h += this.lineHeight();
		var dropCount = 0;
		for (var i = 0; i < enemy.dropItems.length; i++)
		{
			if (enemy.dropItems[i].dataId === 0 || enemy.dropItems[i].kind === 0) continue;
			var item;
			switch (enemy.dropItems[i].kind)
			{
				case 1:
					item = $dataItems[enemy.dropItems[i].dataId];
				break;
				case 2:
					item = $dataWeapons[enemy.dropItems[i].dataId];
				break;
				case 3:
					item = $dataArmors[enemy.dropItems[i].dataId];
				break;
			}

			var dropX = x + (dropCount % 2) * (w * 0.5);
			var dropH = h + Math.floor(dropCount / 2) * this.lineHeight();

			if ($gameSystem.isEnemyItemRevealed(item, enemy.id))
				this.drawItemName(item, dropX, dropH, w * 0.48);
			else
				this.drawText(unknownText, dropX, dropH, w * 0.48);

			dropCount++;
		}
	};
	Window_MonsterInfo.prototype.drawParametersTopPanel = function(rect)
	{
		var enemy = $dataEnemies[this._enemyId];

		this.makeFontBigger();
		var titleText = paramsText;
		if ($gameVariables) {
			var diff = $gameVariables.value(1);
			if (diff === 2) {
				titleText += " [HARD]";
			} else if (diff === 3) {
				titleText += " [VERY HARD]";
			}
		}

		this.drawText(titleText, rect.x+15, rect.y+5, rect.width);
		this.makeFontSmaller();

		var list = paramsList.split(" ");
		var x = rect.x + 30;
		var h = rect.y+50;
		var w = rect.width - 40;
		var tempEnemy = new Game_Enemy(this._enemyId, 0, 0);

		for (var i = 0; i < 8; i++)
		{
			if (paramsMode == "HIDE" && list.contains(String(i))) continue;
			if (paramsMode == "SHOW" && !list.contains(String(i))) continue;

			this.changeTextColor(this.systemColor());
			this.drawText(TextManager.param(i), x, h, w, 'left');
			this.resetTextColor();
			var modifiedValue = tempEnemy.paramBase(i);
			this.drawText(modifiedValue, x, h, w, 'right');

			h += this.lineHeight();
		}
	};

	Window_MonsterInfo.prototype.drawResistancesTopPanel = function(rect)
	{
		var enemy = $dataEnemies[this._enemyId];

		this.makeFontBigger();
		this.drawText(resistancesText, rect.x+15, rect.y+5, rect.width);
		this.makeFontSmaller();

		var resArray = [];

		for (var i = 0; i < enemy.traits.length; i++)
		{
			if (enemy.traits[i].code === 11)
				resArray[enemy.traits[i].dataId] = enemy.traits[i].value;
		}

		var list = elementList.split(" ");
		var x = rect.x + 30;
		var h = rect.y+50;
		var w = rect.width - 40;

		for (var i = 1; i < $dataSystem.elements.length; i++)
		{
			if (elementMode == "HIDE" && list.contains(String(i))) continue;
			if (elementMode == "SHOW" && !list.contains(String(i))) continue;

			this.changeTextColor(this.systemColor());
			this.drawText($dataSystem.elements[i], x, h, w, 'left');
			this.resetTextColor();
			if (resArray[i])
			{
				var r = (resArray[i]*100).toFixed(0);
				if (r > 100)
					this.changeTextColor(ColorManager.crisisColor());
				else if (r < 100)
					this.changeTextColor(ColorManager.powerUpColor());

				this.drawText(r + "%", x, h, w, 'right');
			}
			else
				this.drawText("100%", x, h, w, 'right');
			h += this.lineHeight();
		}
	};

	Window_MonsterInfo.prototype.drawVertLine = function(x, y, l) {
		this.contents.paintOpacity = 48;
		this.contents.fillRect(x, y, 2, l, ColorManager.normalColor());
		this.contents.paintOpacity = 255;
	};

	Window_MonsterInfo.prototype.drawHorzLine = function(x, y, l) {
		this.contents.paintOpacity = 48;
		this.contents.fillRect(x, y, l, 2, ColorManager.normalColor());
		this.contents.paintOpacity = 255;
	};

	Window_MonsterInfo.prototype.createPanelRect = function(panelsCount, id, top)
	{
		var rect = new Rectangle();
		if (top) {
			rect.width = this.contents.width/panelsCount;
			rect.height = this.contents.height * 0.55;
			rect.x = rect.width * id;
			rect.y = 0;
		} else {
			rect.width = this.contents.width - 60;
			rect.height = this.contents.height * 0.4;
			rect.x = 30;
			rect.y = this.contents.height * 0.58;
		}
		return rect;
	};

	Window_MonsterInfo.prototype.setMonster = function(id) {
		if (id != this._enemyId && $gameSystem.isEnemyRevealed(id))
		{
			this._enemyId = id;
			this.refresh();
		}
	};

	function Window_MonsterDescription() {
		this.initialize.apply(this, arguments);
	}

	Window_MonsterDescription.prototype = Object.create(Window_Base.prototype);
	Window_MonsterDescription.prototype.constructor = Window_MonsterDescription;

	Window_MonsterDescription.prototype.initialize = function(rect) {
		Window_Base.prototype.initialize.call(this, rect);
		this._enemyId = 1;
		this.refresh();
	};

	Window_MonsterDescription.prototype.refresh = function() {
		this.contents.clear();

		if (!$gameSystem.isEnemyRevealed(this._enemyId))
			return;
		var bitmap;
		if ($gameSystem.isSideView()) {
			bitmap = ImageManager.loadSvEnemy($dataEnemies[this._enemyId].battlerName, $dataEnemies[this._enemyId].battlerHue);
		} else {
			bitmap = ImageManager.loadEnemy($dataEnemies[this._enemyId].battlerName, $dataEnemies[this._enemyId].battlerHue);
		}
		var c = this.contents;
		bitmap.addLoadListener(function() {
			var bw = bitmap.width;
			var bh = bitmap.height;
			if (bw > c.width)
			{
				var r = c.width / bw;
				bw *= r;
				bh *= r;
			}

			if (bh > c.height)
			{
				var r = c.height / bh;
				bw *= r;
				bh *= r;
			}
			var dx = c.width / 2 - bw / 2;
			var dy = c.height / 2 - bh / 2;
			c.blt(bitmap, 0, 0, bitmap.width, bitmap.height, dx, dy, bw, bh);
		});
	};

	Window_MonsterDescription.prototype.setMonster = function(id) {
		if (id != this._enemyId && $gameSystem.isEnemyRevealed(id))
		{
			this._enemyId = id;
			this.refresh();
		}
	};

	function Window_MonsterList() {
		this.initialize.apply(this, arguments);
	}

	Window_MonsterList.prototype = Object.create(Window_Selectable.prototype);
	Window_MonsterList.prototype.constructor = Window_MonsterList;

	Window_MonsterList.prototype.initialize = function(rect) {
		this.hiddenEnemies = [];
		Window_Selectable.prototype.initialize.call(this, rect);
        this.select(0);
		this.refresh();
		for (var i = 1; i < $dataEnemies.length-1; i++)
		{
			if ($dataEnemies[i].meta.b_hidden) this.hiddenEnemies.push(i);
		}
	};

	Window_MonsterList.prototype.indexPlus = function(index) {
		var t = 0;
		for (var i = 0; i < this.hiddenEnemies.length; i++)
		{
			if (index+t >= this.hiddenEnemies[i]) t++;
		}
		return t;
	};

	Window_MonsterList.prototype.update = function() {
		Window_Selectable.prototype.update.call(this);
		this.updateStatus();
	};

	Window_MonsterList.prototype.updateStatus = function() {
		if (this.descWindow) {
			this.descWindow.setMonster(this.index()+1+this.indexPlus(this.index()+1));
		}
		if (this.dataWindow) {
			this.dataWindow.setMonster(this.index()+1+this.indexPlus(this.index()+1));
		}
	};

	Window_MonsterList.prototype.refresh = function() {
		this.contents.clear();
		this.drawAllItems();
	};

	Window_MonsterList.prototype.maxItems = function() {
		switch (showEntriesMode)
		{
			case 1:
				return $gameSystem.highestId()-this.indexPlus($gameSystem.highestId());
			case 2:
				return $dataEnemies.length-1-this.hiddenEnemies.length;
		}
	};

	Window_MonsterList.prototype.drawItem = function(index) {
		var rect = this.itemRectWithPadding(index);
		var txt = "";
		var l = String(this.maxItems()).length;
		txt += ('0' + (index+1)).slice(-l) + ". ";
		var id = index+1+this.indexPlus(index+1);
		if ($gameSystem.isEnemyRevealed(id))
			txt += $dataEnemies[id].name;
		else
			txt += unknownText;

		this.drawText(txt, rect.x, rect.y, rect.width);
	};

	if (isInMenu === 1)
	{
		var _SceneMenu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
		Scene_Menu.prototype.createCommandWindow = function() {
			_SceneMenu_createCommandWindow.call(this);
			this._commandWindow.setHandler('Bestiary', this.commandBestiary.bind(this));
		};

		Scene_Menu.prototype.commandBestiary = function() {
			SceneManager.push(Scene_Bestiary);
		};

		var _WindowMenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
		Window_MenuCommand.prototype.addOriginalCommands = function() {
			_WindowMenuCommand_addOriginalCommands.call(this);
			this.addCommand(BestiaryCommandText, 'Bestiary', $gameSystem.isBestiaryEnabled());
		};
	}

	var _GameSystem_initialize = Game_System.prototype.initialize;
	Game_System.prototype.initialize = function() {
		_GameSystem_initialize.call(this);
		this._BestiaryEnabled = true;
		this._highestKnownEnemy = 1;
	};

	Game_System.prototype.highestId = function() {
		return this._highestKnownEnemy;
	};

	Game_System.prototype.isBestiaryEnabled = function() {
		return this._BestiaryEnabled;
	};

	Game_System.prototype.isEnemyItemRevealed = function(item, id) {
		var match = false;
		for (var i = 0; i < this._BestiaryItems[id].length; i++)
		{
			var mItem = this._BestiaryItems[id][i];
			if (item.id == mItem.id &&
				((DataManager.isItem(item) && mItem.kind == 1) ||
				 (DataManager.isWeapon(item) && mItem.kind == 2) ||
				 (DataManager.isArmor(item) && mItem.kind == 3)))
				match = true;
		}

		return match;
	};

	Game_System.prototype.isEnemyRevealed = function(id) {
		if (this._Bestiary && this._Bestiary[id])
			return true;
		else
			return false;
	};

	Game_System.prototype.BestiaryClear = function() {
		this._Bestiary = [];
		this._BestiaryItems = {};
		this._highestKnownEnemy = 1;
	};

	Game_System.prototype.BestiaryFill = function() {
		this.BestiaryClear();
		for (var i = 1; i < $dataEnemies.length; i++)
			$gameSystem.BestiaryDiscover(i, true);
	};

	Game_System.prototype.BestiaryDiscover = function(_id, itemsToo) {
		if (!this._Bestiary) this.BestiaryClear();
		if (!this._BestiaryItems[_id]) this._BestiaryItems[_id] = [];
		this._Bestiary[_id] = true;
		if (_id > this._highestKnownEnemy) this._highestKnownEnemy = _id;

		if (!itemsToo) return;
		for (var j = 0; j < $dataEnemies[_id].dropItems.length; j++)
		{
			var item = $dataEnemies[_id].dropItems[j];
			this._BestiaryItems[_id].push({id: item.dataId, kind: item.kind});
		}
	};

	Game_System.prototype.BestiaryDiscoverItem = function(_id, item) {
		if (!this._BestiaryItems[_id]) this._BestiaryItems[_id] = [];

		if (DataManager.isItem(item)) {
			this._BestiaryItems[_id].push({id: item.id, kind: 1});
		}
		else if (DataManager.isWeapon(item)) {
			this._BestiaryItems[_id].push({id: item.id, kind: 2});
		}
		else if (DataManager.isArmor(item)) {
			this._BestiaryItems[_id].push({id: item.id, kind: 3});
		}
	};

	Game_System.prototype.BestiaryHide = function(id) {
		if (this._Bestiary) {
			this._Bestiary[id] = false;
			this._BestiaryItems[id] = [];
		}
	};

	Game_System.prototype.BestiaryEnable = function(bool) {
		this._BestiaryEnabled = bool;
	};

	var _Game_Enemy_makeDropItems = Game_Enemy.prototype.makeDropItems;
	Game_Enemy.prototype.makeDropItems = function() {
		var Recompensa = _Game_Enemy_makeDropItems.call(this);

		if (revealOnKill === 1)
		{
			var eid = this._enemyId;
			$gameSystem.BestiaryDiscover(eid, false);
			Recompensa.forEach(function(item) {
				$gameSystem.BestiaryDiscoverItem(eid, item);
			});
		}

		return Recompensa;
	};

	var _Game_Enemy_setup = Game_Enemy.prototype.setup;
	Game_Enemy.prototype.setup = function(enemyId, x, y) {
		_Game_Enemy_setup.call(this, enemyId, x, y);

		if (revealOnKill === 2)
		{
			$gameSystem.BestiaryDiscover(enemyId, false);
			var a = this.enemy().dropItems.reduce(function(r, di) {
				if (di.kind > 0)
					return r.concat(this.itemObject(di.kind, di.dataId));
				else
					return r;
			}.bind(this), []);
			a.forEach(function(item) {
				$gameSystem.BestiaryDiscoverItem(enemyId, item);
			});
		}
	};
})();


