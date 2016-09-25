var coordinatesMatchInRange = function(coords1, coords2, range) {
    return Math.abs(coords1.x - coords2.x) <= range && Math.abs(coords1.y - coords2.y) <= range;
};