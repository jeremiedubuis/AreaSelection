var getClickCoordinates= function(e, parentEl) {
    var _offset = offset(parentEl || e.currentTarget);
    return {
        x: e.pageX - _offset.left,
        y: e.pageY - _offset.top
    };
};