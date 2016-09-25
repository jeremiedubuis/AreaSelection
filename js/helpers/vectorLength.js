
var vectorLength = function(coords1, coords2) {
    return Math.sqrt( Math.pow(coords1.x - coords2.x,2) + Math.pow(coords1.y - coords2.y,2) );
};