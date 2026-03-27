/*:
 * @target MZ
 * @plugindesc Habilita as teclas WASD para movimentar personagem
 * @author Leandro Nunes
 * @url www.1337games.com.br
 *
 * @help WASD_Movement.js
 *
 * Este plugin mapeia as teclas WASD para as direções de movimento.
 */

(() => {
    "use strict";
    const _Input_setupEventHandlers = Input._setupEventHandlers;

    Input._setupEventHandlers = function () {
        _Input_setupEventHandlers.call(this);
    };
    const WASD_MAP = {
        87: "up",
        65: "left",
        83: "down",
        68: "right",
    };
    const _Input_keyMapper = Input.keyMapper;

    for (const [keyCode, direction] of Object.entries(WASD_MAP)) {
        Input.keyMapper[keyCode] = direction;
    }

})();


