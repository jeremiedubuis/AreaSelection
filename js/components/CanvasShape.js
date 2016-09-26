/**
 * ================================================================================
 *                                  CanvasShape
 * ================================================================================
 */

var CanvasShape = function(bounds1, bounds2) {
    this.init(bounds1, bounds2);
};

CanvasShape.prototype = {

    init: function(bounds1, bounds2) {
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

    move: function(amountHorizontal,amountVertical) {
        if (this.boundaries) {
            var _outOfBounds;
            var x;
            var y;
            for (var i = 0, j = this.points.length; i<j; ++i) {
                x = this.points[i].x + amountHorizontal;
                y = this.points[i].y + amountVertical;
                if ( x < this.boundaries[0].x || x> this.boundaries[1].x ||
                    y < this.boundaries[0].y || y > this.boundaries[1].y) {
                    _outOfBounds = true;
                    break;
                }
            }
        }
        if (_outOfBounds) return false;
        this.center.x += amountHorizontal;
        this.center.y += amountVertical;
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
        this.scaleX += amountHorizontal / this.ratio;
        this.scaleY += amountVertical / this.ratio;
        if (this.scaleX<.1) this.scaleX = .1;
        if (this.scaleY<.1) this.scaleY = .1;
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

    _intersectsWithPolygonEdge: function(point,limit, a1, a2) {

        return 0;
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
        return this.vectorsFromCenterToPoints(this.vectorsFromCenter || this.pointsToVectorsFromCenter() );
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
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            points: this.vectorsFromCenter,
            pointsFromBoundaries: this.pointsFromBoundaries(),
            ratio: this.ratio,
            center: this.center
        };
    },

    /**
     * This gives per 1 coordinates for points instead of center relative coordinates
     */
    pointsFromBoundaries: function() {
        var points = [];
        var _this = this;

        this.points.forEach(function(point) {
            points.push({
                x: point.x / _this.boundaries[1].x,
                y: point.y / _this.boundaries[1].y
            });
        });
        return points;
    }
};