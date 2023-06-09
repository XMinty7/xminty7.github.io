import * as tools from "./binomialtoolshared.js";
import * as graph from "./binomialtoolgraphs.js";

onmessage = (e) => {
	let { n, r, s, p, g, h } = e.data;
	switch (e.data.type) {
		case "calc-kills":
			calcKills(r, p, s, g, h);
			break;
		case "calc-kills-plus":
			calcKillsPlus(r, p, s, g);
			break;
		case "calc-chance":
			calcChance(n, r, p, g, h);
			break;
		case "calc-chance-plus":
			calcChancePlus(n, r, p, g);
			break;
	}
}

function calcChance(n, r, p, g, h = true) {
	if (h == undefined) h = true;
	let points = [];
	let pointslog = [];
	
	let maxr, maxc = Number.NEGATIVE_INFINITY;
	
	for (let j = 0; j <= n; j++) {
		let chance = tools.bino(n, j, p);
		points.push(j, chance);
		pointslog.push(Math.log2(j + 1), chance);
		if (chance > maxc) {
			maxr = j;
			maxc = chance;
		}
	}
	
	if (g) {
		Promise.all([
			graph.plot(points, undefined, undefined, {}, h ? [ { x: r, y: tools.bino(n, r, p) } ] : [ { x: maxr, y: maxc } ], true),
			graph.plot(pointslog, x => Math.round(2**x - 1).toFixed(0), undefined, {}, h ? [ { x: Math.log2(r), y: tools.bino(n, r, p) } ] : [ { x: Math.log2(maxr + 1), y: maxc } ])
		]).then(([blob, bloblog]) => {
			postMessage({ type: "calc-chance", blob, bloblog, maxr, maxc });
		});
	} else {
		postMessage({ type: "calc-chance" });
	}
}

function calcChancePlus(n, r, p, g) {
	let points = [];
	let pointslog = [];
	
	for (let j = 0; j <= n; j++) {
		let chance = tools.binosum(n, j, n, p);
		points.push(j, chance);
		pointslog.push(Math.log2(j + 1), chance);
	}
	
	if (g) {
		Promise.all([
			graph.plot(points, undefined, undefined, {}, [ { x: r, y: tools.binosum(n, r, n, p) } ], true),
			graph.plot(pointslog, x => Math.round(2**x - 1).toFixed(0), undefined, {}, [ { x: Math.log2(r + 1), y: tools.binosum(n, r, n, p) } ])
		]).then(([blob, bloblog]) => {
			postMessage({ type: "calc-chance", blob, bloblog });
		});
	} else {
		postMessage({ type: "calc-chance" });
	}
}

function calcKills(r, p, s, g, h) {
	let points = [];
	let pointslog = [];
	
	let maxn, maxnlog, maxc = Number.NEGATIVE_INFINITY;
	let closen1 = Number.POSITIVE_INFINITY;
	let closen2 = Number.POSITIVE_INFINITY;
	let closec1, closec2;
	
	let chanceo = NaN;
	let chance = 0;
	for (let n = Math.max(r, 1); n < 1024 || chance > (maxc / 100000); n++) {
		chance = tools.bino(n, r, p);
		if (chance <= s && s <= chanceo) {
			closen2 = n;
			if ((chanceo - s) <= (s - chance)) {
				closen2--;
				closec2 = chanceo;
			} else {
				closec2 = chance;
			}
		}
		if (chanceo <= s && s <= chance) {
			closen1 = n;
			if ((s - chanceo) <= (chance - s)) {
				closen1--;
				closec1 = chanceo;
			} else {
				closec1 = chance;
			}
		}
		chanceo = chance;
		if (chance > maxc) {
			maxc = chance;
			maxn = n;
		}
		points.push(n, chance);
		pointslog.push(Math.log2(n), chance);
	}
	
	let highlights = [];
	if (h === true) highlights.push({ x: maxn, y: maxc });
	else if (h === false) highlights.push({ x: closen1, y: closec1 }, { x: closen2, y: closec2 });
	let highlightslog = [];
	if (h === true) highlightslog.push({ x: Math.log2(maxn), y: maxc });
	else if (h === false) highlightslog.push({ x: Math.log2(closen1), y: closec1 }, { x: Math.log2(closen2), y: closec2 });
	
	if (h instanceof Array) {
		highlights = h;
		highlightslog = h.map(o => ({ x: Math.log2(o.x), y: o.y }));
	};
	
	if (g) {
		Promise.all([
			graph.plot(points, (x) => x.toFixed(0), undefined, {}, highlights),
			graph.plot(pointslog, (x) => Math.round(2**x).toFixed(0), undefined, {}, highlightslog)
		]).then(([blob, bloblog]) => {
			postMessage({ type: "calc-kills", maxn, closen1, closen2, blob, bloblog });
		});
	} else {
		postMessage({ type: "calc-kills", maxn, closen2, closen1 });
	}
}

function calcKillsPlus(r, p, s, g) {
	let points = [];
	let pointslog = [];
	
	let closen = Number.POSITIVE_INFINITY;
	let closec;
	
	let chanceo = NaN;
	let chance = 0;
	for (let n = Math.max(r, 1); n <= 1024 || chance < 0.9999999999; n++) {
		chance = tools.binosum(n, r, n, p);
		if (chanceo <= s && s <= chance) {
			closen = n;
			if ((s - chanceo) <= (chance - s)) {
				closen--;
				closec = chanceo;
			} else {
				closec = chance;
			}
		}
		chanceo = chance;
		points.push(n, chance);
		pointslog.push(Math.log2(n), chance);
	}
	
	if (g) {
		Promise.all([
			graph.plot(points, (x) => x.toFixed(0), undefined, {}, [{ x: closen, y: closec }]),
			graph.plot(pointslog, (x) => Math.ceil(2**x).toFixed(0), undefined, {}, [{ x: Math.log2(closen), y: closec }])
		]).then(([blob, bloblog]) => {
			postMessage({ type: "calc-kills-plus", closen, blob, bloblog });
		});
	} else {
		postMessage({ type: "calc-kills-plus", closen });
	}
}