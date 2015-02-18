'use strict';

// Define a constant packing interval
var step = 30;


module.exports = {
  bboxifyLabel: bboxifyLabel,
  toSegments: toSegments,
  getDistance: getDistance,
  cumulative: cumulative, 
  createPolylineToLine: createPolylineToLine,
  createLineToPolyline: createLineToPolyline,
  createPolylineToXY: createPolylineToXY
}


Math.sign = Math.sign || function(x) {
  x = +x; // convert to a number
  if (x === 0 || isNaN(x)) {
    return x;
  }
  return x > 0 ? 1 : -1;
}


var pi4 = 0.25 * Math.PI;


// Create segments for the polyline
function toSegments(polyline) {
  var segments = [];
  
  for (var i = 0; i < polyline.length - 1; i++) {
    var p0 = polyline[i];
    var p1 = polyline[i+1];
    segments.push([p0, p1]);
  }
  
  return segments;
}


// Euclidean distance
function getDistance(p0, p1) {
  var a = p1[0] - p0[0];
  var b = p1[1] - p0[1];
  
  return Math.sqrt(a * a + b * b);
}


function add(a, b) {
  return a + b;
}


function cumulative(a, b) {
  if (a.length > 0) {
    b += a[a.length - 1];
  }
  a.push(b);
  return a;
}


function createPolylineToLine(cumulativeDistances) {
  
  return function polyline2line(segmentIndex, segmentDistance) {
    return cumulativeDistances[segmentIndex] + segmentDistance;
  }
  
}


function createLineToPolyline(cumulativeDistances) {
  
  return function line2polyline(lineDistance) {
    
    // Determine when the line distance exceeds the cumulative distance
    var segmentIndex = cumulativeDistances.slice(1).map(function(d) {
      return d < lineDistance;
    }).reduce(add);
    segmentIndex = Math.min(segmentIndex, cumulativeDistances.length - 2);
    
    var segmentDistance = lineDistance - cumulativeDistances[segmentIndex];
    
    return [segmentIndex, segmentDistance];
  }
  
}


function createPolylineToXY(segments) {
  
  return function polyline2xy(segmentIndex, segmentDistance) {
    var segment = segments[segmentIndex];
    
    var p0 = segment[0];
    var p1 = segment[1];
    
    var x0 = p0[0], y0 = p0[1];
    var x1 = p1[0], y1 = p1[1];
    
    var direction = Math.sign(x1 - x0);
    
    var m = (y1 - y0) / (x1 - x0);
    var x = x0 + direction * Math.sqrt(segmentDistance * segmentDistance / (1 + m * m));
    var y = m * (x - x0) + y0;
    
    return [x, y];
  }
  
}


function bboxifyLabel(polyline, anchor, labelLength, size) {
  
  // polyline: array of coordinates
  // anchor: { index: i, point: [x0, y0] }
  // labelLength: length of labels in pixel units
  // size: length of the box sides
  
  // Determine the bounding boxes needed to cover the label in the
  // neighborhood of the anchor.
  
  
  // Start with a straight-line representation of the polyline
  var segments = toSegments(polyline);
  
  // Keep track of segment lengths
  var distances = segments.map(function(segment) {
    return getDistance(segment[0], segment[1]);
  });
  var cumulativeDistances = [0].concat(distances.reduce(cumulative, []));
  
  var polyline2line = createPolylineToLine(cumulativeDistances);
  var line2polyline = createLineToPolyline(cumulativeDistances);
  var polyline2xy = createPolylineToXY(segments);
  
  var anchorSegment = segments[anchor.index];
  var anchorSegmentDistance = getDistance(anchorSegment[0], anchor.point);
  
  var anchorLineCoordinate = polyline2line(anchor.index, anchorSegmentDistance);
  
  // Determine where the 1st and last bounding boxes
  // lie on the line reference frame
  var labelStartLineCoordinate = anchorLineCoordinate - 0.5 * labelLength;
  var labelEndLineCoordinate = anchorLineCoordinate + 0.5 * labelLength;
  
  var nBoxes = ~~((labelEndLineCoordinate - labelStartLineCoordinate) / step);
  
  // Create boxes with constant packing
  var bboxes = [];
  for (var i = 0; i < nBoxes; i++) {
    
    var lineCoordinate = labelStartLineCoordinate + i * step;
    
    // Convert to polyline reference frame
    var polylineCoordinate = line2polyline(lineCoordinate);
    
    // Convert to canvas reference frame
    var xy = polyline2xy.apply(undefined, polylineCoordinate);
    
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
