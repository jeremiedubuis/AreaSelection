var pointOnSegment= function(point, a1 , a2) {
    if (point.x <= Math.max(a1.x, a2.x) && point.x >= Math.min(a1.x, a2.x) &&
        point.y <= Math.max(a1.y, a2.y) && point.y >= Math.min(a1.y, a2.y))
        return true;

    return false;
};