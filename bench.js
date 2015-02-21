
var bboxifyLabel = require('./index').bboxifyLabel;

var points = [[627,5120],[627,5115],[634,5036],[636,5011],[637,4998],[640,4970],[642,4947],[647,4894],[651,4842],[655,4790],[656,4751],[656,4730],[656,4684],[655,4660],[653,4632],[651,4607],[644,4559],[639,4529],[628,4477],[616,4425],[589,4323],[575,4272],[549,4170],[536,4120],[522,4068],[508,4018],[447,3799],[414,3686],[345,3455],[333,3369],[325,3277],[328,3178],[336,3086],[355,2987],[363,2958],[374,2922],[402,2825],[422,2759],[468,2607],[494,2521],[518,2419],[538,2286],[563,2108],[584,1966],[599,1922],[625,1864],[657,1795],[740,1637],[779,1571],[858,1439],[935,1280],[998,1131],[1035,1033],[1068,949],[1129,776],[1152,712],[1197,587],[1243,454],[1252,431],[1280,353],[1350,170],[1360,149],[1375,117],[1391,87],[1409,57],[1418,41],[1424,32],[1449,-8],[1475,-46],[1516,-103],[1548,-143],[1572,-171],[1609,-211],[1635,-237],[1649,-249],[1663,-261],[1683,-278],[1697,-289],[1726,-310],[1772,-340],[1802,-358],[1818,-367],[1836,-377],[1870,-394],[1893,-404],[1917,-413],[1940,-420],[1965,-426],[1989,-431],[2002,-433],[2020,-435],[2052,-437],[2100,-437],[2147,-435],[2329,-418],[2396,-413],[2451,-411],[2465,-411],[2496,-413],[2517,-416],[2548,-423],[2598,-438],[2622,-447],[2645,-458],[2657,-464],[2668,-470],[2685,-481],[2696,-488],[2729,-512],[2739,-520],[2759,-539],[2772,-552],[2791,-575],[2804,-592],[2825,-622],[2847,-660],[2856,-682],[2874,-755],[2877,-773],[2879,-796],[2880,-822],[2881,-834],[2880,-858],[2878,-882],[2877,-894],[2873,-917],[2871,-926],[2865,-952],[2856,-980],[2851,-993],[2840,-1017],[2837,-1024]];

var anchor = {index: 80, point: points[80]},
	labelLen = 1500;

var start = now(),
	ops = 0;

while (now() - start < 1) {
	bboxifyLabel(points, anchor, labelLen);
	ops++;
}

console.log(Math.round(ops / (now() - start)) + ' ops/s');

function now() {
	var hr = process.hrtime();
	return hr[0] + hr[1] / 1e9;
}
