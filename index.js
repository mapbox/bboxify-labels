'use strict';

module.exports = {
  bboxifyLabel: bboxifyLabel,
  getDistance: getDistance
};

// Euclidean distance
function getDistance(p0, p1) {
  var a = p1[0] - p0[0];
  var b = p1[1] - p0[1];

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

  var x0 = p0[0], y0 = p0[1];
  var x1 = p1[0], y1 = p1[1];

  var direction = x1 > x0 ? 1 : -1;

  var m = (y1 - y0) / (x1 - x0);
  var x = x0 + direction * Math.sqrt(segmentDistance * segmentDistance / (1 + m * m));
  var y = m * (x - x0) + y0;

  return [x, y];
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
  // polyline: array of coordinates
  // anchor: { index: i, point: [x0, y0] }
  // labelLength: length of labels in pixel units
  // size: length of the box sides

  // Determine the bounding boxes needed to cover the label in the
  // neighborhood of the anchor.

  // Keep track of segment lengths
  var cumulativeDistances = getCumulativeDistances(polyline);

  var anchorSegmentDistance = getDistance(polyline[anchor.index], anchor.point);

  var anchorLineCoordinate = cumulativeDistances[anchor.index] + anchorSegmentDistance;

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
    var xy = polyline2xy(polyline, polylineCoordinate[0], polylineCoordinate[1]);

    bboxes.push({
      x: xy[0],
      y: xy[1],
      width: size,
      height: size,
      distanceToAnchor: lineCoordinate - anchorLineCoordinate
    });
  }

  return bboxes;
}
