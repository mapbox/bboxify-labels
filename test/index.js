'use strict';

var test = require('tape');
var bboxify = require('../');

var bboxifyLabel = require('../').bboxifyLabel;
var toSegments = require('../').toSegments


test('toSegments', function (t) {
  
  var points = [[1, 1], [2, 2], [3, 3]];
  var expected = [ [ [1, 1], [2, 2] ], [ [2, 2], [3, 3] ] ];
  
  var segments = bboxify.toSegments(points);
  
  t.deepEqual(expected, segments);
  t.end();
});


test('getDistance', function(t) {
  
  var p0 = [2, 2];
  var p1 = [3, 3];
  
  var expected = Math.sqrt(2);
  
  var d = bboxify.getDistance(p0, p1);
  t.equal(d, expected);
  t.end();
});


test('linear', function(t) {
  
  var p0 = [2, 2];
  var p1 = [3, 3];
  
  var expected = 1;
  
  var y = bboxify.linear(p0, p1, 1);
  t.equal(y, expected);
  t.end();
});


test('cumulative', function(t) {
  
  var arr = [1, 2, 3, 4];
  var expected = [1, 3, 6, 10];
  var cumulativeSum = arr.reduce(bboxify.cumulative, []);
  
  t.deepEqual(cumulativeSum, expected);
  t.end();
});


test('polyline2line', function(t) {
  
  var cumulativeDistances = [0, 100, 150, 300];
  var polyline2line = bboxify.createPolylineToLine(cumulativeDistances);
  
  // point is -30 units w.r.t the 1st segment
  var polylinePoint0 = [0, -30];
  var expectedLinePoint0 = -30;
  var linePoint0 = polyline2line.apply(undefined, polylinePoint0);
  t.equal(linePoint0, expectedLinePoint0);
  
  
  // point is 30 units w.r.t the second segment
  var polylinePoint1 = [1, 30]; 
  var expectedLinePoint1 = 130;
  var linePoint1 = polyline2line.apply(undefined, polylinePoint1);
  t.equal(linePoint1, expectedLinePoint1);
  
  
  // point is 30 units beyond the last segment
  var polylinePoint2 = [2, 180];
  var expectedLinePoint2 = 330;
  var linePoint2 = polyline2line.apply(undefined, polylinePoint2);
  t.equal(linePoint2, expectedLinePoint2);
  
  t.end();
});


test('line2polyline', function(t) {
  
  var cumulativeDistances = [0, 100, 150, 300];
  var line2polyline = bboxify.createLineToPolyline(cumulativeDistances);
  
  // point is -30 units w.r.t the 1st segment
  var linePoint0 = -30;
  var expectedPolylinePoint0 = [0, -30];
  var polylinePoint0 = line2polyline(linePoint0);
  t.deepEqual(polylinePoint0, expectedPolylinePoint0);
  
  // point is 30 units w.r.t to the 2nd segment
  var linePoint1 = 130;
  var expectedPolylinePoint1 = [1, 30];
  var polylinePoint1 = line2polyline(linePoint1)
  t.deepEqual(polylinePoint1, expectedPolylinePoint1);
  
  // point is 30 units beyonds the last segment
  var linePoint2 = 330;
  var expectedPolylinePoint2 = [2, 180];
  var polylinePoint2 = line2polyline(linePoint2);
  t.deepEqual(polylinePoint2, expectedPolylinePoint2);
  
  t.end();
});


test('polyline2xy', function(t) {
  
  var points = [[10, 10], [30, 20], [70, 50]];
  var segments = bboxify.toSegments(points);
  
  var polyline2xy = bboxify.createPolylineToXY(segments);
  var segmentIndex = 1;
  var segmentDistance = 20;
  var expected = [46, 32];
  
  var xy = polyline2xy(segmentIndex, segmentDistance);
  
  t.deepEqual(xy, expected);
  t.end();
});


test('getBoxInterval', function(t) {
  
  var angle1 = 0;
  var interval1 = bboxify.getBoxInterval(angle1)
  var expected1 = bboxify.boxWidth;
  t.equal(interval1, expected1);
  
  var angle2 = Math.PI * 0.25;
  var interval2 = bboxify.getBoxInterval(angle2);
  var expected2 = Math.sqrt(0.25 * bboxify.boxWidth * bboxify.boxWidth + 0.25 * bboxify.boxHeight * bboxify.boxHeight);
  t.equal(interval2, expected2);
  
  t.end();
});
