var AreaSelection;

(function() {
var coordinatesMatchInRange = function(coords1, coords2, range) {
    return Math.abs(coords1.x - coords2.x) <= range && Math.abs(coords1.y - coords2.y) <= range;
};

/**
 * @desc An equivalent to jQuery's extend, a mixin function that extends an object with another,
 * @param object1: object to be complemented
 * @param object2: object's properties will be applied to object1
 */
var extend = function() {
    for(var i=1; i<arguments.length; i++)
        for(var key in arguments[i])
            if(arguments[i].hasOwnProperty(key))
                arguments[0][key] = arguments[i][key];
    return arguments[0];
};
var getAngle = function(intersection, point1, point2) {

    var vTop = Math.pow(point2.x - point1.x,2) + Math.pow(point2.y - point1.y,2);
    var vLeft = Math.pow(point1.x - intersection.x,2) + Math.pow(point1.y - intersection.y,2);
    var vRight = Math.pow(point2.x - intersection.x,2) + Math.pow(point2.y - intersection.y,2);
    return Math.acos( (vTop - vRight - vLeft ) / (-2 * Math.sqrt(vLeft) * Math.sqrt(vRight)) ) * 180 / Math.PI;
};
var getClickCoordinates= function(e, parentEl) {
    var _offset = offset(parentEl || e.currentTarget);
    return {
        x: e.pageX - _offset.left,
        y: e.pageY - _offset.top
    };
};
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
/**
 * @desc An equivalent to jquery's offset function that allows to get an element's offset to top left corner of document
 * @param  function, [DOM node]
 */
var offset = function (el) {

    var rect = el.getBoundingClientRect()

    return {
        top: rect.top + document.body.scrollTop,
        left: rect.left + document.body.scrollLeft
    };

};
var pointOnSegment= function(point, a1 , a2) {
    if (point.x <= Math.max(a1.x, a2.x) && point.x >= Math.min(a1.x, a2.x) &&
        point.y <= Math.max(a1.y, a2.y) && point.y >= Math.min(a1.y, a2.y))
        return true;

    return false;
};
var polyfillLineDash = function( canvasContext ) {
    if (!canvasContext.setLineDash) {
        canvasContext.setLineDash = function() {};
    }

    return canvasContext;
};
var segmentsIntersect = function(a1,a2, b1,b2) {

    // Find the four orientations needed for general and
    // special cases
    var o1 = triangleOrientation(a1, a2, b1);
    var o2 = triangleOrientation(a1, a2, b2);
    var o3 = triangleOrientation(b1, b2, a1);
    var o4 = triangleOrientation(b1, b2, a2);

    // General case
    if (o1 != o2 && o3 != o4)
        return true;

    // Special Cases
    // p1, q1 and p2 are colinear and p2 lies on segment p1q1
    if (o1 == 0 && pointOnSegment(a1, b1, a2)) return true;

    // p1, q1 and p2 are colinear and q2 lies on segment p1q1
    if (o2 == 0 && pointOnSegment(a1, b1, a2)) return true;

    // p2, q2 and p1 are colinear and p1 lies on segment p2q2
    if (o3 == 0 && pointOnSegment(b1, a1, b1)) return true;

    // p2, q2 and q1 are colinear and q1 lies on segment p2q2
    if (o4 == 0 && pointOnSegment(b1, a2, b2)) return true;

    return false; // Doesn't fall in any of the above cases
};
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

var vectorLength = function(coords1, coords2) {
    return Math.sqrt( Math.pow(coords1.x - coords2.x,2) + Math.pow(coords1.y - coords2.y,2) );
};
/**
 * ================================================================================
 *                                  CanvasShape
 * ================================================================================
 */

var CanvasShape = function(bounds1, bounds2, type) {
    this.init(bounds1, bounds2, type);
};

CanvasShape.prototype = {
    init: function(bounds1, bounds2, type) {

        this.type = type;
        this.points = [];
        if (bounds1 && bounds2) this.boundaries = [bounds1,bounds2]
    },

    closeShape: function() {

        switch (this.type) {
            case 'rectangle':
                if (this.points.length !==4) {
                    this.points.push({x: this.points[0].x,y:this.points[1].y});
                    this.points.splice(1,0,{x: this.points[1].x, y:this.points[0].y});
                }
                break;
        }

        this.pointsToVectorsFromCenter();
        this.closed = true;
    },

    move: function(amountHorizontal,amountVertical, ignoreBounds) {

        if (this.boundaries) {
            var _outOfBoundsX;
            var _outOfBoundsY;
            var x;
            var y;
            for (var i = 0, j = this.points.length; i<j; ++i) {
                x = this.points[i].x + amountHorizontal;
                y = this.points[i].y + amountVertical;
                if ( x < this.boundaries[0].x || x> this.boundaries[1].x  ) _outOfBoundsX = true
                if ( y < this.boundaries[0].y || y > this.boundaries[1].y ) _outOfBoundsY = true;
            }
        }

        if (!_outOfBoundsX || ignoreBounds) this.center.x += amountHorizontal;
        if (!_outOfBoundsY || ignoreBounds) this.center.y += amountVertical;
    },

    scaleRectByAnchor: function(pointIndex, coordinates) {
        this.points[pointIndex].x = coordinates.x;
        this.points[pointIndex].y = coordinates.y;
        switch (pointIndex) {
            case 0:
                this.points[1].y = coordinates.y;
                this.points[3].x = coordinates.x;
                break;
            case 1:
                this.points[0].y = coordinates.y;
                this.points[2].x = coordinates.x;
                break;
            case 2:
                this.points[3].y = coordinates.y;
                this.points[1].x = coordinates.x;
                break;
            case 3:
                this.points[2].y = coordinates.y;
                this.points[0].x = coordinates.x;
                break;
        }
        this.pointsToVectorsFromCenter();
    },

    scale: function(amountHorizontal, amountVertical) {
        if (typeof amountVertical === 'undefined') amountVertical = amountHorizontal;
        this.scaleX += amountHorizontal / this.ratio;
        this.scaleY += amountVertical / this.ratio;
        if (this.scaleX<.1) this.scaleX = .1;
        if (this.scaleY<.1) this.scaleY = .1;
    },

    scalePercents: function(amountHorizontal, amountVertical) {
        if (typeof amountVertical === 'undefined') amountVertical = amountHorizontal;
        amountHorizontal = amountHorizontal *.01;
        amountVertical = amountVertical *.01;

        var _center = this.getCenter();
        var _distX;
        var _distY;

        this.points = this.points.map(function(p) {
            _distX = p.x-_center.x;
            _distX += _distX * amountHorizontal;
            p.x = _center.x + _distX;
            _distY = p.y-_center.y;
            _distY += _distY * amountVertical;
            p.y = _center.y + _distY;
            return p;
        });

        this.pointsToVectorsFromCenter();

    },

    polygonScale: function(amountHorizontal, amountVertical) {
        var _scale = (amountHorizontal+ amountVertical) / 2;
        this.scale( _scale, _scale);
    },

    getCenter: function() {

        var _centerX = 0;
        var _centerY= 0;
        this.points.forEach(function(point) {
            _centerX += point.x;
            _centerY += point.y;
        });
        this.center = {
            x: _centerX/ this.points.length,
            y: _centerY/ this.points.length
        };

        return this.center;

    },

    distanceFromCenter: function(point) {
        return vectorLength(point, this.center || this.getCenter())
    },

    distanceXFromCenter: function(point, absolute) {
        if (absolute) return Math.abs(point.x - (this.center || this.getCenter()).x);
        return point.x - (this.center || this.getCenter()).x;
    },

    distanceYFromCenter: function(point, absolute) {
        if (absolute) return Math.abs(point.y - (this.center || this.getCenter()).y);
        return point.y - (this.center || this.getCenter()).y;
    },

    containsPoint: function(point) {

        // There must be at least 3 vertices in polygon
        if (this.points.length < 3)  return false;


        // Count intersections of the above line with sides of polygon
        var _count = 0;

        var point1;
        var point2;
        for (var i=0, length = this.points.length; i<length; ++i) {

            point1 = this.points[i];
            point2 = i === length-1 ? this.points[0] : this.points[i+1]; //last point is first point of polygon

            if (segmentsIntersect(
                    point, { x: document.documentElement.offsetWidth, y:point.y },
                    point1, point2
                )) {

                if (triangleOrientation(point1, point, point2) === 0){
                    return pointOnSegment(point, point1, point2);
                }
                _count+= 1;
            }

        }

        // Return true if count is odd, false otherwise
        return _count&1;  // Same as (count%2 == 1)
    },

    pointsToVectorsFromCenter: function() {
        var _this = this;
        var _furthestFromCenter;
        var _dist;
        var points = this.points;
        this.vectorsFromCenter = [];
        points.forEach(function(_point) {
            _dist = _this.distanceFromCenter(_point)
            if (typeof _furthestFromCenter === 'undefined' || _dist > _furthestFromCenter) _furthestFromCenter = _dist;
            _this.vectorsFromCenter.push({
                x:_this.distanceXFromCenter(_point),
                y:_this.distanceYFromCenter(_point)
            })
        });

        _furthestFromCenter = Math.max(_furthestFromCenter,1);

        this.vectorsFromCenter = _this.vectorsFromCenter.map(function(_point) {
            return {
                x: _point.x / _furthestFromCenter,
                y: _point.y / _furthestFromCenter
            };
        });
        this.ratio = _furthestFromCenter;

        return this.vectorsFromCenter;
    },

    scaleX: 1,
    scaleY: 1,

    vectorsFromCenterToPoints: function(vectors) {
        this.points = [];
        var _this = this;
        vectors.forEach(function(vector) {
            _this.points.push({
                x: _this.center.x + vector.x * (_this.scaleX * _this.ratio),
                y: _this.center.y + vector.y * (_this.scaleY * _this.ratio)
            });
        });

        return this.points;
    },

    getPoints: function() {
        return this.vectorsFromCenterToPoints( this.vectorsFromCenter || this.pointsToVectorsFromCenter() );
    },

    removePointsRecursively: function(points, multiple, currentIndex) {
        currentIndex+=multiple;
        if (points[currentIndex]) {
            points.splice(currentIndex, 1);
            return this.removePointsRecursively( points, multiple, currentIndex+multiple -1 ); // we just deleted an entry so index goes back by 1
        } else {
            return points;
        }
    },

    export: function() {
        return {
            type: this.type,
            points: this.points,
            vectors: this.vectorsFromCenter,
            ratio: this.ratio,
            center: this.center
        };
    }
};


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
        if (this.currentShape) {
            if ( this.shapes.indexOf(this.currentShape) > -1) {
                this.shapes.splice(this.shapes.indexOf(this.currentShape), 1);
            }
        }
        this.selecting = false;
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


})();