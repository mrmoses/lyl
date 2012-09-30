/**
 * @requires models/leveldata.js
 */
(function (cp) {
    var _background = null;

    var _sort = true;

    cp.template.Background = cp.template.Entity.extend({
        index: 10,
        init: function () {
            console.log('background');
            var animSheet = new cp.animate.sheet('background.png', 1024, 768);
            this.animStill = new cp.animate.cycle(animSheet, 1, [0]);
            this.animSet = this.animStill;
        },

        update: function () {
            if (_sort) {
                _sort = !_sort;
                cp.game.sort('index');
            }

            this._super();
        }
    });
}(cp));