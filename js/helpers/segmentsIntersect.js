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