var getAngle = function(intersection, point1, point2) {

    var vTop = Math.pow(point2.x - point1.x,2) + Math.pow(point2.y - point1.y,2);
    var vLeft = Math.pow(point1.x - intersection.x,2) + Math.pow(point1.y - intersection.y,2);
    var vRight = Math.pow(point2.x - intersection.x,2) + Math.pow(point2.y - intersection.y,2);
    return Math.acos( (vTop - vRight - vLeft ) / (-2 * Math.sqrt(vLeft) * Math.sqrt(vRight)) ) * 180 / Math.PI;
};