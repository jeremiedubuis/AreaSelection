/**
 * For three points returns 0 if colinear, 1 of clockwise, 2 if counterclockwise
 * @param p
 * @param q
 * @param r
 * @returns {number}
 */
var triangleOrientation = function( a,b,c) {
    var val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);

    if (val === 0) return 0;  // colinear

    return (val > 0)? 1: 2; // clock or counterclock wise
};