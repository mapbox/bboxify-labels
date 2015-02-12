'use strict';

module.exports = bboxify;


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


function getBoxInterval(angle) {
  
  // Make distance smaller for tighter packing
  var minDistance = Math.sqrt(0.25 * width * width + 0.25 * height * height);
  var maxDistance = width;
  
  var m = (minDistance - maxDistance) / pi4;
  return m * angle + maxDistance;
}


function bboxify(polyline, anchor, labelLength) {
  
  // Polyline representation
  // [ [x0, y0], [x1, y1], [x2, y2], ..., [xn, yn] ]
  
  var segments = toSegments(polyline);
  
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
