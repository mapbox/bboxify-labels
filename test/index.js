'use strict';

var test = require('tape');
var bboxify = require('../');

var bboxifyLabel = require('../').bboxifyLabel;
var toSegments = require('../').toSegments


test('toSegments', function (t) {
  
  var points = [[1, 1], [2, 2], [3, 3]];
  var expected = [ [ [1, 1], [2, 2] ], [ [2, 2], [3, 3] ] ];
  
  var segments = bboxify.toSegments(points);
  
  t.deepEqual(segments, expected);
  t.end();
});


test('getDistance', function(t) {
  
  var p0 = [2, 2];
  var p1 = [3, 3];
  
  var expected = Math.sqrt(2);
  
  var d = bboxify.getDistance(p0, p1);
  t.equal(expected, d);
  t.end();
});


test('linear', function(t) {
  
  var p0 = [2, 2];
  var p1 = [3, 3];
  
  var expected = 1;
  
  var y = bboxify.linear(p0, p1, 1);
  t.equal(expected, y);
  t.end();
});


test('cumulative', function(t) {
  
  var arr = [1, 2, 3, 4];
  var expected = [1, 3, 6, 10];
  var cumulativeSum = arr.reduce(bboxify.cumulative, []);
  
  t.deepEqual(expected, cumulativeSum);
  t.end();
});


test('polyline2line', function(t) {
  
  var cumulativeDistances = [0, 100, 150, 300];
  var polyline2line = bboxify.createPolylineToLine(cumulativeDistances);
  
  // point is -30 units w.r.t the 1st segment
  var polylinePoint0 = [0, -30];
  var expectedLinePoint0 = -30;
  var linePoint0 = polyline2line.apply(undefined, polylinePoint0);
  t.equal(expectedLinePoint0, linePoint0);
  
  
  // point is 30 units w.r.t the second segment
  var polylinePoint1 = [1, 30]; 
  var expectedLinePoint1 = 130;
  var linePoint1 = polyline2line.apply(undefined, polylinePoint1);
  t.equal(expectedLinePoint1, linePoint1);
  
  
  // point is 30 units beyond the last segment
  var polylinePoint2 = [2, 180];
  var expectedLinePoint2 = 330;
  var linePoint2 = polyline2line.apply(undefined, polylinePoint2);
  t.equal(expectedLinePoint2, linePoint2);
  
  t.end();
});


test('line2polyline', function(t) {
  
  var cumulativeDistances = [0, 100, 150, 300];
  var line2polyline = bboxify.createLineToPolyline(cumulativeDistances);
  
  // point is -30 units w.r.t the 1st segment
  var linePoint0 = -30;
  var expectedPolylinePoint0 = [0, -30];
  var polylinePoint0 = line2polyline(linePoint0);
  t.deepEqual(expectedPolylinePoint0, polylinePoint0);
  
  // point is 30 units w.r.t to the 2nd segment
  var linePoint1 = 130;
  var expectedPolylinePoint1 = [1, 30];
  var polylinePoint1 = line2polyline(linePoint1)
  t.deepEqual(expectedPolylinePoint1, polylinePoint1);
  
  // point is 30 units beyonds the last segment
  var linePoint2 = 330;
  var expectedPolylinePoint2 = [2, 180];
  var polylinePoint2 = line2polyline(linePoint2);
  t.deepEqual(expectedPolylinePoint2, polylinePoint2);
  
  t.end();
});