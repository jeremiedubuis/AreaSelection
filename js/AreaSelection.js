

/**
 * ================================================================================
 *                                  AreaSelection
 * ================================================================================
 */

var _defaults = {
};


AreaSelection = function(wrapper, canvas, options) {
    this.init(wrapper, canvas, options);
};

AreaSelection.prototype = {

    shapes: [],
    init: function(wrapper, canvas, options) {

        var _defaults = {
            onRender: function() {},
            renderTimeout: 50,
            onMove: function(shape, currentCoords, prevCoords) {}
        };
        this.o = extend(_defaults, options);
        this.canvasWrapper = wrapper;
        this.canvas = canvas;
        this.c2d = canvas.getContext('2d');

        polyfillLineDash(this.c2d);

        this.setSize();
        this.bindMethods();
    },

    setSize: function() {
        this.canvas.width = this.canvasWrapper.offsetWidth;
        this.canvas.height = this.canvasWrapper.offsetHeight;
    },

    bindMethods: function() {
        this.fn = {
            selection: {
                onClick: this.selection.onClick.bind(this),
                onRightClick: this.selection.onRightClick.bind(this),
                onMousedown: this.selection.onMousedown.bind(this),
                onMouseup: this.selection.onMouseup.bind(this),
                onMousemove: this.selection.onMousemove.bind(this),
            },
            transformation: {
                onMousedown: this.transformation.onMousedown.bind(this),
                onMouseup: this.transformation.onMouseup.bind(this),
                onMousemove: this.transformation.onMousemove.bind(this)
            },
            drawPoint: this.drawPoint.bind(this)
        };
    },

    startSelection: function(type) {
        this.shapes.push(new CanvasShape({x: 0, y:0}, {x:this.canvas.width, y: this.canvas.height}, type) );
        this.currentShape = this.shapes[this.shapes.length-1];
        this.addListeners('selection');
    },

    addListeners: function(context) {

        if (this.listenerContext) this.removeListeners(this.listenerContext);
        switch(context) {
            case 'selection':
                this.canvasWrapper.addEventListener('click', this.fn.selection.onClick);
                this.canvasWrapper.addEventListener('contextmenu', this.fn.selection.onRightClick);
                this.canvasWrapper.addEventListener('mousedown', this.fn.selection.onMousedown);
                this.canvasWrapper.addEventListener('mousemove', this.fn.selection.onMousemove);
                document.documentElement.addEventListener('mouseup', this.fn.selection.onMouseup);
                break;
            case 'transformation':
                this.canvasWrapper.addEventListener('mousedown', this.fn.transformation.onMousedown);
                document.documentElement.addEventListener('mouseup', this.fn.transformation.onMouseup);
                document.documentElement.addEventListener('mousemove', this.fn.transformation.onMousemove);
                break;
        }
        this.listenerContext = context;

    },

    removeListeners: function(context) {

        if (!context) {
            this.removeListeners('selection');
            this.removeListeners('transformation');
        } else {
            switch(context) {
                case 'selection':
                    this.canvasWrapper.removeEventListener('click', this.fn.selection.onClick);
                    this.canvasWrapper.removeEventListener('contextmenu', this.fn.selection.onRightClick);
                    this.canvasWrapper.removeEventListener('mousedown', this.fn.selection.onMousedown);
                    this.canvasWrapper.removeEventListener('mousemove', this.fn.selection.onMousemove);
                    document.documentElement.removeEventListener('mouseup', this.fn.selection.onMouseup);
                    break;
                case 'transformation':
                    this.canvasWrapper.removeEventListener('mousedown', this.fn.transformation.onMousedown);
                    document.documentElement.removeEventListener('mouseup', this.fn.transformation.onMouseup);
                    document.documentElement.removeEventListener('mousemove', this.fn.transformation.onMousemove);
                    break;
            }
        }

        this.listenerContext = null;

    },

    drawPoint: function(point) {
        this.c2d.beginPath();
        this.c2d.rect(point.x-4, point.y-4, 9, 9);
        this.c2d.stroke();
    },

    drawPath: function(shape, points) {

        this.c2d.save();
        this.c2d.beginPath();
        switch (shape.type) {
            case 'freehand':

                var _point1;
                var _point2;
                this.c2d.moveTo(points[0].x,points[0].y);
                for (var i = 1, j = points.length; i<j; ++i) {
                    _point1 = points[i-1];
                    _point2 = points[i];
                    this.c2d.quadraticCurveTo(
                        _point1.x,
                        _point1.y,
                        ( _point2.x+_point1.x ) / 2,
                        ( _point2.y+_point1.y ) / 2
                    );
                }

                break;
            default:


                this.c2d.moveTo(points[0].x,points[0].y);
                for (var i=1, length= points.length; i<length; ++i) {
                    this.c2d.lineTo(points[i].x,points[i].y);
                }
                break;

        }

        this.c2d.globalCompositeOperation = 'destination-out';
        this.c2d.fill();
        this.c2d.globalCompositeOperation = 'source-over';
        this.c2d.setLineDash([5,5]);

        this.c2d.strokeStyle='white';

        if (shape.type !== 'freehand') this.c2d.closePath();
        else if( this.freehandClose) {
            var p1 = points[points.length-1];
            var p2 = points[0];
            this.c2d.quadraticCurveTo(
                p1.x,
                p1.y,
                ( p2.x+p1.x ) / 2,
                ( p2.y+p1.y ) / 2
            );

            this.c2d.closePath();
        }

        this.c2d.stroke();
        this.c2d.restore();

    },

    renderPoints: function(shape,points) {
        this.c2d.strokeStyle = 'white';
        if (shape.type !=='freehand') points.forEach(this.fn.drawPoint);
    },

    render: function(silent) {
        var _this = this;
        this.renderFlag = true;

        this.clearCanvas();
        this.renderBackground();
        this.shapes.forEach(this.renderShape.bind(this));

        if (!silent) {
            if (!this.currentShape) this.currentShape = this.shapes[this.shapes.length-1];
            this.addListeners('transformation');
        }
        this.o.onRender();
    },

    renderShape: function(shape) {
        if (!shape) shape = this.currentShape;
        var points = shape.getPoints();
        this.drawPath(shape, points);
        this.renderPoints( shape, points);
    },

    renderBackground: function() {
        this.c2d.rect(0,0,this.canvas.width, this.canvas.height);
        this.c2d.fillStyle = 'rgba(0,0,0,0.5)';
        this.c2d.fill();
    },

    resetSelection: function() {
        if (this.currentShape) this.currentShape.points = [];
        this.clearCanvas();
        this.render();
        this.removeListeners();
    },

    reset: function() {
        this.shapes = [];
        this.clearCanvas();
        this.removeListeners();
    },

    refresh: function() {
        this.render(true);
    },

    clearCanvas: function() {
        this.c2d.clearRect(0,0,this.canvas.width, this.canvas.height);
    },

    scaleShape: function(amount) {
        this.shape.scale(amount);
        this.render();
    },

    selectAnchor: function(shape, _index) {
        this.deselectAnchors(true);
        this.selectedAnchor = {
            shape: shape,
            index: _index
        };
        this.render();
    },

    deselectAnchors: function(noRender) {
        this.selectedAnchor = null;
        if (!noRender) this.render();
    },

    setCursor: function(coords) {
        var _this = this;
        var _hoveredShape = this.findShapeAtCoordinates(coords);
        var _previousCursor = _this.canvasWrapper.style.cursor = _hoveredShape ? 'pointer' : 'auto';
        if (_hoveredShape) {
            if ( _hoveredShape.type ==='rectangle') {
                var _match;
                for (var i = 0, j = _hoveredShape.points.length; i<j; ++i) {
                    if ( coordinatesMatchInRange(coords, _hoveredShape.points[i], 5) ) {
                        switch (i) {
                            case 0:
                            case 2:
                                _this.canvasWrapper.style.cursor = 'NW-Resize';
                                break;
                            case 1:
                            case 3:
                                _this.canvasWrapper.style.cursor = 'NE-Resize';
                                break;
                        }
                        _match = i;
                        break;
                    }
                }
                if (typeof _match === 'undefined') _this.canvasWrapper.style.cursor = _previousCursor;
            }
        }
    },

    createRectangleArea: function(p0, p2) {
        var _shape = new CanvasShape({x: 0, y:0}, {x:this.canvas.width, y: this.canvas.height}, 'rectangle');
        this.shapes.push(_shape);
        _shape.points = [p0, p2];
        _shape.closeShape();
        this.render();
    },

    createFreeArea: function(points) {
        var _shape = new CanvasShape({x: 0, y:0}, {x:this.canvas.width, y: this.canvas.height}, 'freehand');
        this.shapes.push(_shape);
        _shape.points = points;
        _shape.closeShape();
        this.render();
    },

    findPointAtCoordinates: function(coords ) {

        for (var i = this.shapes.length-1; i>=0; --i) {
            if (this.shapes[i].type === 'rectangle') {
                for (var k=0, l = this.shapes[i].points.length; k<l; ++k ) {
                    if ( coordinatesMatchInRange(coords, this.shapes[i].points[k], 10) ) {
                        return [this.shapes[i], k];
                    }
                }
            }
        }

        return null;

    },

    findShapeAtCoordinates: function(coords) {
        for (var i = this.shapes.length-1; i>=0; --i) {
            if (this.shapes[i].containsPoint(coords)) return this.shapes[i];
        }
        return null;
    },

    scaleShapesFromCenter: function(scalePercents) {
        this.shapes.forEach(function(shape){
            shape.scalePercents(scalePercents);
        });
        this.render(true);
    },
    offsetShapes: function(offsetX, offsetY, ignoreBounds) {
        this.shapes.forEach(function(shape){
            shape.move(offsetX, offsetY, ignoreBounds);
        });
        this.render(true);
    },


    /**
     * =========================== LISTENERS ===========================
     */
    selection: {

        onClick: function(e) {

            if (this.currentShape.type !== 'rectangle') {
                this.currentShape.points.push(getClickCoordinates(e));
                this.renderPoints(this.currentShape, this.currentShape.points);
            }
        },

        onRightClick: function() {
            if (this.currentShape.type=='rectangle' && this.currentShape.points.length <2) {
                this.resetSelection();
            }
            if (this.currentShape.type==='polygon') {
                if (this.currentShape.points<3) this.resetSelection();
                else {
                    this.currentShape.closeShape();
                    this.render()
                }
            }
        },

        onMousedown: function(e) {
            if (this.currentShape.type === 'rectangle' || this.currentShape.type === 'freehand') {
                this.selecting = this.currentShape.type;
                this.freehandClose = null;
                this.currentShape.points.push(getClickCoordinates(e));
                this.renderPoints(this.currentShape, this.currentShape.points);
            }
        },

        onMousemove: function(e) {
            if (this.selecting) {

                if (this.currentShape.type === 'freehand') {
                    if (!this.freehandTimeout) {
                        var _this = this;
                        this.freehandTimeout = true;
                        this.currentShape.points.push(getClickCoordinates(e));
                        setTimeout(function() {
                            _this.freehandTimeout =  false;
                        },50);
                        this.currentShape.closeShape();
                        this.render(true);
                    }
                } else {
                    if (this.currentShape.points.length === 1) {
                        this.currentShape.points.push(getClickCoordinates(e));
                        this.currentShape.closeShape();
                    } else {
                        if (this.currentShape.type === 'rectangle') this.currentShape.points = [this.currentShape.points[0], getClickCoordinates(e)];
                        else this.currentShape.points[1] = getClickCoordinates(e);
                        this.currentShape.closeShape();
                    }
                    this.render(true);
                }
            }
        },

        onMouseup: function() {
            if (this.selecting) {
                if (this.currentShape.type === 'freehand') {
                    this.freehandClose = true;
                    this.currentShape.closeShape();
                    this.render();
                    this.c2d.closePath();
                } else {
                    this.render();
                }
                this.selecting = null;
            }
        }


    },

    transformation: {

        onMousedown: function(e) {
            if (this.currentShape.closed) {
                var _this = this;
                this.coords = getClickCoordinates(e);

                var pointAtCoordinates = this.findPointAtCoordinates( this.coords );
                if (pointAtCoordinates) _this.selectAnchor(pointAtCoordinates[0], pointAtCoordinates[1]);
                if (!this.selectedShape && !this.selectedAnchor) {
                    this.selectedShape = this.findShapeAtCoordinates(this.coords);
                }

                this.transformationMousedown = true;
            }
        },

        onMousemove: function(e) {
            var coords = getClickCoordinates(e, this.canvasWrapper);
            if ( this.selectedAnchor || this.selectedShape ) {

                // should stop
                if (this.selectedAnchor  ) {
                    this.selectedAnchor.shape.scaleRectByAnchor( this.selectedAnchor.index, coords);
                    this.render();
                    this.o.onMove(this.selectedAnchor.shape,coords, this.coords);
                } else if (this.selectedShape,coords) {
                    this.selectedShape.move(coords.x- this.coords.x, coords.y - this.coords.y);
                    this.render();
                    this.o.onMove(this.selectedShape,coords, this.coords);
                }

                this.coords = coords;
            } else {

                // if mouse was down send move event without shape
                if (this.transformationMousedown) {
                    this.o.onMove(null,coords, this.prevCoords);
                }

                this.setCursor(coords);

            }
            // different from this.coords which is last coords when shape was being selected
            this.prevCoords = coords;

        },

        onMouseup: function(e) {
            if (this.selectedAnchor) this.deselectAnchors(true);
            this.selectedShape = null;
            this.canvas.style.cursor = 'auto';
            this.transformationMousedown = false;
        }
    },

    export: function() {
        return this.shapes.map(function(shape) {
            return shape.export();
        });
    },

    destroy: function() {
        this.reset();
    }

};
