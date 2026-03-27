/*:
 * @target MZ
 * @plugindesc Adiciona armas amaldiçoadas que podem matar o usuário
 * @author Leandro Nunes
 * @url www.1337games.com.br
 * 
 * @help CursedWeapon.js
 * 
 * Este plugin permite criar armas que têm uma chance de matar
 * o personagem que as está equipando quando ataca.
 * 
 * Como usar:
 * Na seção "Notas" da arma, adicione:
 * <deathCurse:X>
 * 
 * Onde X é a porcentagem de chance (exemplo: 5 para 5%)
 * 
 * Exemplo: <deathCurse:5>
 * Isso dará 5% de chance de matar o usuário ao atacar
 */

(() => {
    'use strict';
    const _Game_Battler_performActionEnd = Game_Battler.prototype.performActionEnd;
    Game_Battler.prototype.performActionEnd = function() {
        _Game_Battler_performActionEnd.call(this);
        this.checkCursedWeapon();
    };
    Game_Battler.prototype.checkCursedWeapon = function() {
        if (!this.isActor()) return;

        const weapons = this.weapons();
        for (const weapon of weapons) {
            if (weapon && weapon.meta.deathCurse) {
                const chance = Number(weapon.meta.deathCurse);
                const random = Math.random() * 100;

                if (random < chance) {
                    this.triggerCursedWeaponEffect(weapon);
                }
            }
        }
    };
    Game_Battler.prototype.triggerCursedWeaponEffect = function(weapon) {
        this.setHp(0);
        const message = `${this.name()} foi consumido pela maldição de ${weapon.name}!`;
        $gameMessage.add(message);
        AudioManager.playSe({
            name: 'Darkness5',
            volume: 90,
            pitch: 100,
            pan: 0
        });
    };
    const _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        if (this.isPhysical() && this.subject().isActor()) {
            this.checkCursedWeaponOnAttack();
        }
    };

    Game_Action.prototype.checkCursedWeaponOnAttack = function() {
        const subject = this.subject();
        if (!subject.isActor()) return;

        const weapons = subject.weapons();
        for (const weapon of weapons) {
            if (weapon && weapon.meta.deathCurse) {
                const chance = Number(weapon.meta.deathCurse);
                const random = Math.random() * 100;

                if (random < chance) {
                    setTimeout(() => {
                        subject.setHp(0);
                        const message = `${subject.name()} sucumbiu à maldição!`;
                        BattleManager._logWindow.addText(message);
                    }, 500);
                }
            }
        }
    };

})();


