/**
 * @requires models/leveldata.js
 */
(function (cp) {
    var _mute = false;

    var SELF = null;

    //var _private = {
    //    gameOver: function (win) {
    //        // Delete all of the players
    //        var players = cp.game.entityGetVal('name', 'player');
    //        for (var i = players.length; i--;) {
    //            players[i].kill();
    //        }
    //
    //        // Play audio message
    //        if (win) {
    //            cp.audio.play('win');
    //        } else if (win === false) {
    //            cp.audio.play('loser');
    //        } else {
    //            cp.audio.play('oh-yeah-high');
    //        }
    //
    //        // Show the correct win or lose message
    //    }
    //};

    cp.template.Level = cp.template.Entity.extend({
        name: 'level',

        init: function () {
            if (SELF === null) {
                // Used to determine the width of the game's play area
                this.bind();

                if (!_mute) {
                    cp.audio
                        .newSound('music')
                        .play('music');

                    cp.audio.newSound('loser');
                    cp.audio.newSound('oh-yeah-high');
                }
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
        },

        gameOver: function (win) {
            // Delete all of the players
            var players = cp.game.entityGetVal('name', 'player');
            for (var i = players.length; i--;) {
                players[i].kill();
            }

            // Play audio message
            if (win === false) {
                cp.audio.play('loser');
            } else {
                cp.audio.play('oh-yeah-high');
            }

            // Show the correct win or lose message
        }
    });
}(cp));