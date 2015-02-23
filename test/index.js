'use strict';

var test = require('tape');
var bboxify = require('../');

var bboxifyLabel = require('../').bboxifyLabel;


test('getDistance', function(t) {

  var p0 = {x: 2, y: 2};
  var p1 = {x: 3, y: 3};
  
  var expected = Math.sqrt(2);

  var d = bboxify.getDistance(p0, p1);
  t.equal(d, expected);
  t.end();
});


test('cumulative', function(t) {
  
  var points = [
    {x: 10, y: 10},
    {x: 30, y: 20},
    {x: 70, y: 50}
  ]
  
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

  var points = [
    {x: 10, y: 10},
    {x: 30, y: 20},
    {x: 70, y: 50}
  ];
  
  var cumulativeDistances = bboxify.getCumulativeDistances(points);
  
  var segmentIndex = 1;
  var segmentDistance = 20;
  var expected = {x: 46, y:32};

  var xy = bboxify.polyline2xy(points, segmentIndex, segmentDistance);

  t.deepEqual(xy, expected);
  t.end();
});


test('bboxify should not return boxes in the same location', function(t) {
  var geom = [{"x":2056,"y":3980},{"x":2078,"y":3658},{"x":2083,"y":3637},{"x":2095,"y":3599},{"x":2197,"y":3347},{"x":2200,"y":3335},{"x":2202,"y":3325},{"x":2202,"y":3314},{"x":2202,"y":3267},{"x":2202,"y":3216},{"x":2202,"y":3160}];
  var anchor = {"x":2202,"y":3268.6150427287844,"angle":-1.5707963267948966,"segment":7};
  var length = 17.30625;
  var height = 3.8999999999999995;
  
  var boxes = bboxify.bboxifyLabel(geom, anchor, length, height);
  
  // assert boxes are not in the same location
  for (var i = 0; i < boxes.length - 1; i++) {
    var b1 = boxes[i];
    var b2 = boxes[i+1];  
    
    var p1 = {x: b1.x, y:b1.y};
    var p2 = {x: b2.x, y:b2.y};
    
    t.notDeepEqual(p1, p2);
  }
  
  t.end()
});
