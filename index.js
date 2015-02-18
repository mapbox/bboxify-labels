'use strict';

// Define a constant packing interval
var step = 30;


module.exports = {
  bboxifyLabel: bboxifyLabel,
  toSegments: toSegments,
  getDistance: getDistance,
  linear: linear,
  cumulative: cumulative,
  createPolylineToLine: createPolylineToLine,
  createLineToPolyline: createLineToPolyline,
  createPolylineToXY: createPolylineToXY,
  getBoxInterval: getBoxInterval
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


function linear(p0, p1, x) {
  var x0 = p0[0], y0 = p0[1];
  var x1 = p1[0], y1 = p1[1];
  
  return (y1 - y0) / (x1 - x0) * (x - x0) + y0;
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


function getBoxInterval(angle, size) {
  
  // Make min distance smaller for tighter packing of boxes
  
  // min distance is a function of the box diagonal
  var hypot = Math.sqrt(size * size + size * size);
  
  var minDistance = 0.5 * hypot;
  var maxDistance = size;
  
  var m = (minDistance - maxDistance) / pi4;
  return m * angle + maxDistance;
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
  
  
  // Tranform the label coordinates to the polyline reference frame
  var labelStartPolylineCoordinate = line2polyline(labelStartLineCoordinate);
  var labelEndPolylineCoordinate = line2polyline(labelEndLineCoordinate);
  
  var p0 = polyline2xy(labelStartPolylineCoordinate[0], labelStartPolylineCoordinate[1]);
  var p1 = polyline2xy(labelEndPolylineCoordinate[0], labelEndPolylineCoordinate[1]);
  
  // Get all segments that have the label
  var startSegment = labelStartPolylineCoordinate[0];
  var endSegment = labelEndPolylineCoordinate[0];
  
  var labeledSegments = segments.slice(startSegment, endSegment + 1);
  
  // Change the start point of the outer segments to match the extent of the label
  labeledSegments[0][0] = p0;
  labeledSegments[labeledSegments.length - 1][1] = p1;
  
  var bboxes = labeledSegments.map(function(segment, i) {
    var segmentIndex = startSegment + i;
    var last = ~~((i + 1) / labeledSegments.length);
    
    var p0 = segment[0];
    var p1 = segment[1];
    
    var x0 = p0[0], y0 = p0[1];
    var x1 = p1[0], y1 = p1[1];
    
    var segmentLength = getDistance(p0, p1);
    var direction = Math.sign(x1 - x0);
    
    var adjacent = getDistance(p0, [x0, y1]);
    var opposite = getDistance(p0, [x1, y0]);
    
    // TODO: Find smallest angle of incident with axis without
    //       comparison?
    var angle1 = Math.acos(adjacent / segmentLength);
    var angle2 = 0.5 * Math.PI - angle1;
    var angle = Math.min(angle1, angle2);
    
    var d = getBoxInterval(angle, size);
    var nBoxes = Math.max(~~(segmentLength / d + 0.5), 1);
    
    // Get parameters for the segment
    var m = (y1 - y0) / (x1 - x0);
    var b = y0 - m * x0;
    
    var lineFunction = function(x) {
      return m * x + b;
    }
    
    var bboxes = [];
    for (var j = 0; j < nBoxes + last; j++) {
      
      var distanceToSegmentOrigin = getDistance(p0, [x0, y0]);
      var lineCoordinate = polyline2line(segmentIndex, distanceToSegmentOrigin);
      var distanceToAnchor = lineCoordinate - anchorLineCoordinate;
      
      bboxes.push({
        x: x0,
        y: y0,
        width: size,
        height: size,
        distanceToAnchor: distanceToAnchor
      });
      
      // Step along the line
      x0 = x0 + direction * d / Math.sqrt(1 + m * m);
      y0 = lineFunction(x0);
    }
    
    return bboxes;
  });
  
  return bboxes.reduce(function(a, b) {
    return a.concat(b);
  });
}
