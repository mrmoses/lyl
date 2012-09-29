/**
 * @requires models/leveldata.js
 */
(function (cp) {
    var _debug = true;

    var _private = {
        gameOver: function () {

        }
    };

    cp.template.Level = cp.template.Entity.extend({
        name: 'level1',

        init: function () {
            // Used to determine the width of the game's play area
            this.bind();

            if (_debug) {
                cp.game.spawn('Player');
                cp.game.spawn('RemotePlayer');
            }
        },

        update: function () {
            return;
        },

        draw: function () {
            return;
        },

        bind: function () {
            cp.input.bind('arrowUp', 'up');
            cp.input.bind('arrowDown', 'down');
            cp.input.bind('arrowLeft', 'left');
            cp.input.bind('arrowRight', 'right');
        }
    });
}(cp));