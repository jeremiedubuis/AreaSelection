

/**
 * ================================================================================
 *                                  AreaSelection
 * ================================================================================
 */

var _defaults = {
};


AreaSelection = function(wrapper, canvas, options) {
    this.init(wrapper, canvas);
};

AreaSelection.prototype = {

    init: function(wrapper, canvas) {
        this.canvasWrapper = wrapper;
        this.canvas = canvas;
        this.c2d = canvas.getContext('2d');

        this.polyfill();

        this.setSize();
        this.bindMethods();
        this.shape = new CanvasShape({x: 0, y:0}, {x:this.canvas.width, y: this.canvas.height});
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
        this.resetSelection();
        this.shape.type = type;
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


    selectedAnchor: -1,

    drawPoint: function(point) {
        this.c2d.beginPath();
        this.c2d.rect(point.x-4, point.y-4, 9, 9);
        this.c2d.stroke();
    },

    drawPath: function(points) {

        this.c2d.save();
        this.c2d.beginPath();
        switch (this.shape.type) {
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

        if (this.shape.type !== 'freehand') this.c2d.closePath();
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

    renderPoints: function(points) {
        this.c2d.strokeStyle = 'white';
        if (this.shape.type !=='freehand') points.forEach(this.fn.drawPoint);
    },

    renderShape: function(keepSelecting) {
        this.clearCanvas();
        this.renderBackground();
        var points = this.shape.getPoints();
        this.drawPath(points);
        this.renderPoints(points);
        if (!keepSelecting) this.addListeners('transformation');
    },

    renderBackground: function() {
        this.c2d.rect(0,0,this.canvas.width, this.canvas.height);
        this.c2d.fillStyle = 'rgba(0,0,0,0.5)';
        this.c2d.fill();
    },

    resetSelection: function() {
        if (this.shape) this.shape.points = [];
        this.clearCanvas();
        this.removeListeners();
    },

    clearCanvas: function() {
        this.c2d.clearRect(0,0,this.canvas.width, this.canvas.height);
    },

    scaleShape: function(amount) {
        this.shape.scale(amount);
        this.renderShape();
    },

    selectAnchor: function(_index) {
        this.deselectAnchors(true);
        this.selectedAnchor = _index;
        this.shape.points[_index].selected = true;
        this.renderShape();
    },

    deselectAnchors: function(noRender) {
        this.shape.points.map(function(point) {
            point.selected = false;
            return point;
        });
        this.selectedAnchor = -1;
        if (!noRender) this.renderShape();
    },

    setCursor: function(coords) {
        var _this = this;
        var _previousCursor = _this.canvas.style.cursor = this.shape.containsPoint(coords) ? 'pointer' : 'auto';

        if (this.shape.type ==='rectangle') {
            var _match;
            for (var i = 0, j = this.shape.points.length; i<j; ++i) {
                if ( coordinatesMatchInRange(coords, this.shape.points[i], 5) ) {
                    switch (i) {
                        case 0:
                        case 2:
                            _this.canvas.style.cursor = 'NW-Resize';
                            break;
                        case 1:
                        case 3:
                            _this.canvas.style.cursor = 'NE-Resize';
                            break;
                    }
                    _match = i;
                    break;
                }
            }
            if (typeof _match === 'undefined') _this.canvas.style.cursor = _previousCursor;
        }
    },

    createRectangleArea: function(p0, p2) {
        this.shape.type='rectangle';
        this.shape.points = [p0, p2];
        this.shape.closeShape();
        this.renderShape();
    },


    /**
     * =========================== LISTENERS ===========================
     */
    selection: {

        onClick: function(e) {

            if (this.shape.type !== 'rectangle') {
                this.shape.points.push(getClickCoordinates(e));
                this.renderPoints(this.shape.points);
            }
        },

        onRightClick: function() {
            if (this.shape.type=='rectangle' && this.shape.points.length <2) {
                this.resetSelection();
            }
            if (this.shape.type==='polygon') {
                if (this.shape.points<3) this.resetSelection();
                else {
                    this.shape.closeShape();
                    this.renderShape()
                }
            }
        },

        onMousedown: function(e) {
            if (this.shape.type === 'rectangle' || this.shape.type === 'freehand') {
                this.selecting = this.shape.type;
                this.freehandClose = null;
                this.shape.points.push(getClickCoordinates(e));
                this.renderPoints(this.shape.points);
            }
        },

        onMousemove: function(e) {
            if (this.selecting) {

                if (this.shape.type === 'freehand') {
                    if (!this.freehandTimeout) {
                        var _this = this;
                        this.freehandTimeout = true;
                        this.shape.points.push(getClickCoordinates(e));
                        setTimeout(function() {
                            _this.freehandTimeout =  false;
                        },50);
                        this.shape.closeShape();
                        this.renderShape(true);
                    }
                } else {
                    if (this.shape.points.length === 1) {
                        this.shape.points.push(getClickCoordinates(e));
                        this.shape.closeShape();
                    } else {
                        if (this.shape.type === 'rectangle') this.shape.points = [this.shape.points[0], getClickCoordinates(e)];
                        else this.shape.points[1] = getClickCoordinates(e);
                        this.shape.closeShape();
                    }
                    this.renderShape(true);
                }
            }
        },

        onMouseup: function() {
            if (this.selecting) {
                this.selecting = null;
                if (this.shape.type === 'freehand') {
                    this.freehandClose = true;
                    this.shape.closeShape();
                    this.renderShape();
                    this.c2d.closePath();
                } else {
                    this.renderShape();
                }
            }
        }


    },

    transformation: {

        onMousedown: function(e) {
            if (this.shape.closed) {
                var _this = this;
                this.coords = getClickCoordinates(e);

                if (this.shape.type ==='rectangle') {
                    this.shape.points.forEach(function(point, i) {
                        if ( coordinatesMatchInRange(_this.coords, point, 15) ) {
                            _this.selectAnchor(i);
                        }
                    });
                }


                if (!this.shape.selected && this.selectedAnchor === -1) {
                    if (this.shape.containsPoint(this.coords)) {
                        this.shape.selected = true;
                    }
                }
            }
        },

        onMousemove: function(e) {
            var coords = getClickCoordinates(e, this.canvasWrapper);
            if ( this.selectedAnchor > -1 || this.shape.selected ) {

                // should stop
                if (this.selectedAnchor > -1 ) {
                    this.shape.scaleRectByAnchor( this.selectedAnchor, coords);
                    this.renderShape();

                } else if (this.shape.selected) {
                    this.shape.move(coords.x- this.coords.x, coords.y - this.coords.y);
                    this.renderShape();
                }

                this.coords = coords;
            } else {

                this.setCursor(coords);

            }
        },

        onMouseup: function(e) {
            if (this.selectedAnchor > -1) this.deselectAnchors(true);
            this.shape.selected = false;
            this.canvas.style.cursor = 'auto';
        }
    },

    polyfill: function() {
        if (!this.c2d.setLineDash) {
            this.c2d.setLineDash = function() {};
        }
    },

    destroy: function() {
        this.removeListeners();
    }

};
