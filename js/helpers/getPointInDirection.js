var getPointInDirection = function(coords1, coords2, distance) {
    var fi = Math.atan2(coords2.y - coords1.y, coords2.x - coords1.x);
    var _deltaX = Math.round( distance* Math.cos(fi) );
    var _deltaY = Math.round( distance* Math.sin(fi) );

    if ( ( _deltaX > 0 && coords1.x+_deltaX > coords2.x ) || (_deltaX < 0 && coords1.x+_deltaX < coords2.x ) ) _deltaX = coords2.x - coords1.x;
    if ( ( _deltaY > 0 && coords1.y+_deltaY > coords2.y ) || ( _deltaY < 0 && coords1.y+_deltaY < coords2.y ) ) _deltaY = coords2.y - coords1.y;


    coords1.x +=  _deltaX;
    coords1.y +=  _deltaY;
    return coords1;
};