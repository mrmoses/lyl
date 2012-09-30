/**
 * @requires 'models/.js'
 */
(function(cp) {
    /**
     * @todo Get it to work on enemies and players
     */
    cp.template.Powerup = cp.template.Entity.extend({
    	type: 'b',
        width: 30,
        height: 30,

        init: function (x, y) {
            this.x = x;
            this.y = y;
        },

    	update: function () {
            return;
        },

        draw: function () {
            console.log(this.x, this.y);
            cp.ctx.fillStyle = '#000';
            cp.ctx.fillRect(this.x, this.y, this.width, this.height);
        },

        collide: function () {
            console.log('pickup');
        }
    });

}(cp));