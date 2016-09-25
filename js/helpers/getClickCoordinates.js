var getClickCoordinates= function(e) {
    var _offset = offset(e.currentTarget);
    return {
        x: e.pageX - _offset.left,
        y: e.pageY - _offset.top
    };
};