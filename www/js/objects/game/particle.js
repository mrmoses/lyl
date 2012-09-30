/**
 * @requires models/leveldata.js
 */
(function (cp) {
    cp.template.Lemming = cp.template.Entity.extend({
        deathDelay: 1000,

        init: function (x, y) {
            this.x = x;
            this.y = y;

            this.speedX = cp.math.random(3) * cp.math.randomPosNeg();
            this.speedY = cp.math.random(3) * cp.math.randomPosNeg();

            // Create and set an animation sheet (image, frame width, frame height)
            var animSheet = new cp.animate.sheet('particle.png', 30, 29);

            // Choose a particular animation sequence from the sheet
            this.animStill = new cp.animate.cycle(animSheet, 1, [0]);

            this.animSet = this.animStill;
        },

        update: function () {
            this._super();

            this.x += this.speedX;
            this.y += this.speedY;

            if (this.deathDelay > 0) {
                var ratio = this.deathDelay / 1000
                this.alpha = ratio;
                this.angle = ratio * 360;
                this.deathDelay -= cp.core.delta;
            } else {
                this.kill();
            }
        }
    });

    cp.template.LemmingExplosion = cp.template.Entity.extend({
        init: function (x, y) {
            this.x = x;
            this.y = y;

            var numLemmings = cp.math.random(10, 3);
            for (var i = numLemmings; i--;) {
                cp.game.spawn('Lemming', this.x, this.y);
            }
        },

        update: function () {
            this.kill();
        }
    });
}(cp));