'use strict';

module.exports = {
  bboxifyLabel: bboxifyLabel,
  toSegments: toSegments,
  getDistance: getDistance,
  linear: linear,
  cumulative: cumulative,
  createPolylineToLine: createPolylineToLine,
  createLineToPolyline: createLineToPolyline
}


var pi4 = 0.25 * Math.PI;

// Fix the bounding box dimensions for now
var width = 30;
var height = 30;


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


function getBoxInterval(angle) {
  
  // Make distance smaller for tighter packing
  var minDistance = Math.sqrt(0.25 * width * width + 0.25 * height * height);
  var maxDistance = width;
  
  var m = (minDistance - maxDistance) / pi4;
  return m * angle + maxDistance;
}


function bboxifyLabel(polyline, anchor, labelLength) {
  
  // polyline: array of coordinates
  // anchor: { index: i, point: [x0, y0] }
  // labelLength: length of labels in pixel units
  
  // Determine the bounding boxes needed to cover the label in the
  // neighborhood of the anchor.
  
  
  // Start with a straight-line representation of the polyline
  var segments = toSegments(polyline);
  
  // Keep track of segment lengths
  var distances = segments.map(function(segment) {
    return getDistance(segment[0], segment[1]);
  });
  var cumulativeDistances = [0].concat(distances.reduce(cumulative, []));
  
  
  console.log('segments.length', segments.length);
  console.log('cumulativeDistances', cumulativeDistances.length);
  
  var polyline2line = createPolylineToLine(cumulativeDistances);
  var line2polyline = createLineToPolyline(cumulativeDistances);
  
  
  function polyline2xy(segmentIndex, segmentDistance) {
    var segment = segments[segmentIndex];
    
    var x = segment[0][0] + segmentDistance;
    // var x = segmentDistance;
    var y = linear(segment[0], segment[1], x);
    
    return [x, y];
  }
  
  var anchorSegment = segments[anchor.index];
  var anchorSegmentDistance = getDistance(anchorSegment[0], anchor.point);
  
  console.log('anchorSegmentDistance', anchorSegmentDistance);
  
  var anchorLineCoordinate = polyline2line(anchor.index, anchorSegmentDistance);
  
  // Determine where the 1st and last bounding boxes
  // lie on the line reference frame
  var labelStartLineCoordinate = anchorLineCoordinate - 0.5 * labelLength;
  var labelEndLineCoordinate = anchorLineCoordinate + 0.5 * labelLength;
  
  // Tranform the label coordinates to the polyline reference frame
  var labelStartPolylineCoordinate = line2polyline(labelStartLineCoordinate);
  var labelEndPolylineCoordinate = line2polyline(labelEndLineCoordinate);
  
  console.log('cumulativeDistances', cumulativeDistances);
  console.log('anchorLineCoordinate', anchorLineCoordinate);
  console.log('anchorPolylineCoordinate', line2polyline(anchorLineCoordinate));
  console.log('labelStartLineCoordinate', labelStartLineCoordinate);
  console.log('labelEndLineCoordinate', labelEndLineCoordinate);
  console.log('labelStartPolylineCoordinate', labelStartPolylineCoordinate);
  console.log('labelEndPolylineCoordinate', labelEndPolylineCoordinate);
  
  var p0 = polyline2xy(labelStartPolylineCoordinate[0], labelStartPolylineCoordinate[1]);
  var p1 = polyline2xy(labelEndPolylineCoordinate[0], labelEndPolylineCoordinate[1]);
  
  console.log('labelStartXY', p0);
  
  bboxes = [];
  bboxes.push([{
    x: p0[0] - 0.5 * width,
    y: p0[1] - 0.5 * height,
    width: width,
    height: height
  }]);
  console.log(bboxes);
  
  bboxes.push([{
    x: p1[0] - 0.5 * width,
    y: p1[1] - 0.5 * height,
    width: width,
    height: height
  }]);
  
  return bboxes;
  
  
  var bboxes = segments.map(function(segment, i) {
    
    var p0 = segment[0];
    var p1 = segment[1];
    var segmentLength = getDistance(p0, p1);
    var direction = Math.sign(p1[0] - p0[0]);
    
    var adjacent = getDistance(p0, [p0[0], p1[1]]);
    var opposite = getDistance(p0, [p1[0], p0[1]]);
    
    // TODO: Find smallest angle of incident with axis without
    //       comparison?
    var angle1 = Math.acos(adjacent / segmentLength);
    var angle2 = 0.5 * Math.PI - angle1;
    var angle = Math.min(angle1, angle2);
    
    var d = getBoxInterval(angle);
    var nBoxes = ~~(segmentLength / d + 0.5);
    
    // Get parameters for the segment
    var m = (p1[1] - p0[1]) / (p1[0] - p0[0]);
    var b = p0[1] - m * p0[0];
    
    var lineFunction = function(x) {
      return m * x + b;
    }
    
    var bboxes = [];
    var x0 = p0[0];
    var y0 = p0[1];
    for (var j = 0; j < nBoxes + 1; j++) {
      
      bboxes.push({
        x: x0 - 0.5 * width,
        y: y0 - 0.5 * height,
        width: width,
        height: height
      });
      
      x0 = x0 + direction * d / Math.sqrt(1 + m * m);
      y0 = lineFunction(x0);
    }
    
    return bboxes;
  });
  
  return bboxes;
}
