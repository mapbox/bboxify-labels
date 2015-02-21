'use strict';

var test = require('tape');
var bboxify = require('../');

var bboxifyLabel = require('../').bboxifyLabel;


test('getDistance', function(t) {

  var p0 = [2, 2];
  var p1 = [3, 3];

  var expected = Math.sqrt(2);

  var d = bboxify.getDistance(p0, p1);
  t.equal(d, expected);
  t.end();
});


test('cumulative', function(t) {
  
  var points = [[10, 10], [30, 20], [70, 50]];
  t.end();
});


test('line2polyline', function(t) {

  var cumulativeDistances = [0, 100, 150, 300];

  // point is -30 units w.r.t the 1st segment
  var linePoint0 = -30;
  var expectedPolylinePoint0 = [0, -30];
  var polylinePoint0 = bboxify.line2polyline(cumulativeDistances, linePoint0);
  t.deepEqual(polylinePoint0, expectedPolylinePoint0);

  // point is 30 units w.r.t to the 2nd segment
  var linePoint1 = 130;
  var expectedPolylinePoint1 = [1, 30];
  var polylinePoint1 = bboxify.line2polyline(cumulativeDistances, linePoint1)
  t.deepEqual(polylinePoint1, expectedPolylinePoint1);

  // point is 30 units beyonds the last segment
  var linePoint2 = 330;
  var expectedPolylinePoint2 = [2, 180];
  var polylinePoint2 = bboxify.line2polyline(cumulativeDistances, linePoint2);
  t.deepEqual(polylinePoint2, expectedPolylinePoint2);

  t.end();
});


test('polyline2xy', function(t) {

  var points = [[10, 10], [30, 20], [70, 50]];
  var cumulativeDistances = bboxify.getCumulativeDistances(points);
  
  var segmentIndex = 1;
  var segmentDistance = 20;
  var expected = [46, 32];

  var xy = bboxify.polyline2xy(points, segmentIndex, segmentDistance);

  t.deepEqual(xy, expected);
  t.end();
});


test('bboxify should not return nans', function(t) {
  
  var geom = [[3497,3342],[3506,3343],[3518,3345],[3526,3345],[3536,3346],[3551,3347],[3583,3350],[3611,3352],[3623,3352],[3643,3348],[3654,3346],[3666,3343],[3712,3335],[3720,3326],[3785,3314]];
  var anchor = {
    index: 13,
    point: [3765.2091567163498, 3317.653694144674]
  };
  var length = 259.1333333333333;
  var height = 124.79999999999998;
  
  var boxes = bboxify.bboxifyLabel(geom, anchor, length, height);
  
  
  for (var i = 0; i < boxes.length; i++) {
    var box = boxes[i];
    
    t.notEqual(NaN, box.x);
    t.notEqual(NaN, box.y);
  }
  
  t.end();
});

