var polyfillLineDash = function( canvasContext ) {
    if (!canvasContext.setLineDash) {
        canvasContext.setLineDash = function() {};
    }

    return canvasContext;
};