'use strict';

module.exports = {
  bboxifyLabel: bboxifyLabel,
  getDistance: getDistance,
  getCumulativeDistances: getCumulativeDistances,
  line2polyline: line2polyline,
  polyline2xy: polyline2xy,
};

// Euclidean distance
function getDistance(p0, p1) {
  
  var a = p1.x - p0.x;
  var b = p1.y - p0.y;

  return Math.sqrt(a * a + b * b);
}

function line2polyline(cumulativeDistances, lineDistance) {
  // Determine when the line distance exceeds the cumulative distance
  var segmentIndex = 1;
  while (cumulativeDistances[segmentIndex] < lineDistance) segmentIndex++;

  segmentIndex = Math.min(segmentIndex - 1, cumulativeDistances.length - 2);

  var segmentDistance = lineDistance - cumulativeDistances[segmentIndex];

  return [segmentIndex, segmentDistance];
}

function polyline2xy(points, segmentIndex, segmentDistance) {
  var p0 = points[segmentIndex];
  var p1 = points[segmentIndex + 1];

  var x0 = p0.x, y0 = p0.y;
  var x1 = p1.x, y1 = p1.y;

  var direction = x1 > x0 ? 1 : -1;
  
  var m = (y1 - y0) / (x1 - x0);
  var x = x0 + direction * Math.sqrt(segmentDistance * segmentDistance / (1 + m * m));
  
  var dy = m * (x - x0);
  var y = dy + y0 || y0;
  
  return {x: x, y: y};
}

function getCumulativeDistances(points) {
  var distances = [0];
  for (var i = 1, dist = 0; i < points.length; i++) {
    dist += getDistance(points[i], points[i - 1]);
    distances.push(dist);
  }
  return distances;
}

function bboxifyLabel(polyline, anchor, labelLength, size) {
  var step = size / 2;
  
  // polyline: array of coordinates [ {x: x0, y: y0}, ..., {x: xn, y: yn} ]
  // anchor: { segment: i, x: x0, y: y0 }
  // labelLength: length of labels in pixel units
  // size: length of the box sides

  // Determine the bounding boxes needed to cover the label in the
  // neighborhood of the anchor.

  // Keep track of segment lengths
  var cumulativeDistances = getCumulativeDistances(polyline);
  
  var anchorSegmentDistance = getDistance(polyline[anchor.segment], anchor);
  
  var anchorLineCoordinate = cumulativeDistances[anchor.segment] + anchorSegmentDistance;
  
  // Determine where the 1st and last bounding boxes
  // lie on the line reference frame
  var labelStartLineCoordinate = anchorLineCoordinate - 0.5 * labelLength;
  var labelEndLineCoordinate = anchorLineCoordinate + 0.5 * labelLength;

  var nBoxes = Math.floor((labelEndLineCoordinate - labelStartLineCoordinate) / step);

  // Create boxes with constant packing
  var bboxes = [];
  for (var i = 0; i < nBoxes; i++) {

    var lineCoordinate = labelStartLineCoordinate + i * step;

    // Convert to polyline reference frame
    var polylineCoordinate = line2polyline(cumulativeDistances, lineCoordinate);

    // Convert to canvas reference frame
    var p = polyline2xy(polyline, polylineCoordinate[0], polylineCoordinate[1]);
    
    bboxes.push({
      x: p.x,
      y: p.y,
      width: size,
      height: size,
      distanceToAnchor: lineCoordinate - anchorLineCoordinate
    });
  }

  return bboxes;
}
