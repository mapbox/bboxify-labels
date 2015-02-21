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
  
  var geom = [[4039,-96],[4040,-40],[4040,-23],[4040,-10],[4040,2],[4039,14],[4038,26],[4037,36],[4035,49],[4032,62],[4029,74],[4027,84],[4023,96],[4015,120],[4008,137],[4002,151],[3993,167],[3985,182],[3977,195],[3969,207],[3954,226],[3934,252],[3917,274],[3904,292],[3893,309],[3883,325],[3875,341],[3867,358],[3858,378],[3851,398],[3845,416],[3840,436],[3835,456],[3832,479],[3830,497],[3829,518],[3828,538],[3829,561],[3831,585],[3839,705],[3840,726],[3840,747],[3840,771],[3839,790],[3837,813],[3834,832],[3830,856],[3827,871],[3821,894],[3816,910],[3810,930],[3801,952],[3791,977],[3782,996],[3774,1013],[3765,1029],[3755,1046],[3742,1065],[3736,1073],[3727,1085],[3718,1096],[3703,1114],[3683,1137],[3669,1154],[3656,1171],[3643,1190],[3633,1206],[3622,1223]];
  var anchor = {
    index: 38,
    point: [3838.1348281926157,692.0224228892362]
  };
  var length = 1390.1333333333332;
  var height = 124.79999999999998;
  
  var boxes = bboxify.bboxifyLabel(geom, anchor, length, height);
  
  for (var i = 0; i < boxes.length; i++) {
    var box = boxes[i];
    console.log(box);
    t.equal(false, isNaN(box.x));
    t.equal(false, isNaN(box.y));
  }
  
  t.end();
});

