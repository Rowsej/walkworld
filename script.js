const selectEl = query => document.querySelector(query);
Math.seed = 42;
Math.seededRandom = function() {
	Math.seed = (Math.seed * 9301 + 49297) % 233280;
	return Math.seed / 233280;
};
function random(a, b) {
	if(a === undefined && b === undefined) {
		return random(0, 2);
	} else if(Number.isInteger(a) && b === undefined) {
		return ~~(Math.seededRandom() * a);
	} else if(Number.isInteger(a) && Number.isInteger(b)) {
		return ~~(Math.seededRandom() * (b - a)) + a;
	} else if(Array.isArray(a)) {
		return a[random(a.length)];
	} else {
		return undefined;
	}
}
function Array2D(w, h) {
	var arr = new Array(h);
	for(var i = 0; i < arr.length; i++) {
		arr[i] = new Array(w);
	}
	return arr;
}
async function delay(millis) {
	return new Promise(function(resolve, reject) {
		setTimeout(resolve, millis);
	});
}
function getTime() {
	return (new Date()).getTime();
}
const min = Math.min;
const max = Math.max;
const round = Math.round;
const abs = Math.abs;
const pi = Math.PI;
const hypot = Math.hypot;
const sin = theta => Math.sin(theta * pi / 180);
const cos = theta => Math.cos(theta * pi / 180);
const atan2 = (x, y) => Math.atan2(x, y) / pi * 180;

var can, ctx;
var joystickEl, joystickCenter;
var joystick = {
	x: 0,
	y: 0,
	a: 0
};

var keyStates = [];

var level = {	
	map: Array2D(30, 300),
	scrollOffset: {
		x: 0,
		y: 0
	},
	gravity: 0.5
};

var player = {
	absPos: {
		x: 480,
		y: 480
	},
	relPos: {
		x: 0,
		y: 0
	},
	size: {
		width: 32,
		height: 32
	},
	v: {
		x: 0,
		y: 0
	},
	jumps: 0,
	maxJumps: 2,
	lastJumpTime: 0,
	jumpInterval: 500,
	draw: function() {
		ctx.drawImage(Assets.playerImg, this.relPos.x, this.relPos.y, this.size.width, this.size.height);
	},
	checkForCollision: function() {
		if(this.absPos.y == 0) {
			return true;
		}
		var tiles = [];
		tiles.push([~~(this.absPos.x / 40), ~~(this.absPos.y / 40)]);
		var touchingX = (this.absPos.x + this.size.width) % 40 > 0;
		var touchingY = (this.absPos.y + this.size.height) % 40 > 0;
		if(touchingX && touchingY) {
			tiles.push([~~((this.absPos.x + this.size.width) / 40), ~~((this.absPos.y + this.size.height) / 40)]);
		}
		if(touchingX) {
			tiles.push([~~((this.absPos.x + this.size.width) / 40), ~~(this.absPos.y / 40)]);
		}
		if(touchingY) {
			tiles.push([~~(this.absPos.x / 40), ~~((this.absPos.y + this.size.height) / 40)]);
		}
		var hit = false;
		tiles.forEach(function(tile) {
			if(Opacity[level.map[tile[0]][tile[1]]]) {
				hit = true;
			}
		});
		if(keyStates.includes("k")) {
			console.log(JSON.stringify(tiles));
			console.log([this.absPos.x % 40 > 0, this.absPos.y % 40 > 0]);
		}
		return hit;
	}
};

var Blocks = {
	DIRT_WITH_GRASS: 0,
	DIRT: 1,
	STONE: 2,
	SAND: 3,
	SANDSTONE: 4,
	OAK_LOG: 5,
	BIRCH_LOG: 6,
	LEAF_UPPER_LEFT: 7,
	LEAF_UPPER_MIDDLE: 8,
	LEAF_UPPER_RIGHT: 9,
	LEAF_MIDDLE_LEFT: 10,
	LEAF_MIDDLE_MIDDLE: 11,
	LEAF_MIDDLE_RIGHT: 12,
	LEAF_BOTTOM_LEFT: 13,
	OAK_LEAF_BOTTOM_MIDDLE: 14,
	BIRCH_LEAF_BOTTOM_MIDDLE: 15,
	LEAF_BOTTOM_RIGHT: 16,
	CACTUS: 17,
	AIR: 63
};
var Opacity = {
	[Blocks.DIRT_WITH_GRASS]: 1,
	[Blocks.DIRT]: 1,
	[Blocks.STONE]: 1,
	[Blocks.SAND]: 1,
	[Blocks.SANDSTONE]: 1,
	[Blocks.OAK_LOG]: 0,
	[Blocks.BIRCH_LOG]: 0,
	[Blocks.LEAF_UPPER_LEFT]: 0,
	[Blocks.LEAF_UPPER_MIDDLE]: 0,
	[Blocks.LEAF_UPPER_RIGHT]: 0,
	[Blocks.LEAF_MIDDLE_LEFT]: 0,
	[Blocks.LEAF_MIDDLE_MIDDLE]: 0,
	[Blocks.LEAF_MIDDLE_RIGHT]: 0,
	[Blocks.LEAF_BOTTOM_LEFT]: 0,
	[Blocks.LEAF_BOTTOM_RIGHT]: 0,
	[Blocks.OAK_LEAF_BOTTOM_MIDDLE]: 0,
	[Blocks.BIRCH_LEAF_BOTTOM_MIDDLE]: 0,
	[Blocks.AIR]: 0
};
var Biomes = {
	PLAINS: 0,
	DESERT: 1
};

var Assets = {
	playerImg: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAFKADAAQAAAABAAAAFAAAAACy3fD9AAAAd0lEQVQ4EWPsP/vrPwMVARMVzQIbNfgNZIF5udCYDcz8/x8SpBPO/YZJYaULjFhRxGHqaedlkMtgrkOxmgCHkZGRAYRhgOouZBxNhwyw5AMLZHw0NrVUj5TBbyA86yGHFbawQZbHx8YwEJgu8aknKDf4w5DqLgQALKgaK3rS1oEAAAAASUVORK5CYII=",
	blockSpritesheet: "data:image/png;base64,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jgB9HV8kT9s40zTA8RdTkmPpUPHOdg+1U/fQNBqYcpQOnztKP08coqA/aSPv4p79TzdN2tNMUwasJfeN0+bRDWfMpY2/fkOPrn+Tfuk4SKP5YLN/s9FEZx3pohdvWU5Lz7yI3680ohmg750dHOmtJN8fiLY7/oybeSB4U3VZUnSomhMDWjRhDm0d/J6Guo/Swc5hHhWP0/GJeRpuOm72o3WkibpGJ1LzXyeo61AbG+7JtHDy+bR9wP0rrWI4y6ZfTNt+2UUr+5bS5t920JY/d5uj4q6B32mkddSUd0prO7X+3UQ3zp1PV502hxZPu5Be7d1o1lXFWzRSqdDrTVhur4mn4SUcFn4jI2gnJtAH/CRBqLX6yA8qrWLlfJ4mHCfRoQbupH+badpvHaaX5sv9xG+5Lp7WfiqtmHW16aVsyZ/4vd/9s8BOmdXehDjblnio7w/YlZ+kQY5vsNPpi2wgS4f09TzhHkcaAX3u7LDdK/n9gUBCDN5N5+m2QGXLFEpoSVGmFcdl6TucSaDWI2Bn5M+hlzZy3c8j169dxc95+yV9h2MCtTVA+f5AdCevUDwVvXqNalp9TvbxZ41USaLZcOeAcrDZG/ARWNxnzDk2L7jMEwg3Ambs+wiZ/3RToGDYTYi84VJZl7PFyzSFUdDGkc1IWAOU16uSdec+UpC35yWi3FgSU3CBS4ZjLgMM8GpR0O8j5B2GlGF8UC0uAZcBlhF2gp/fbipTRi+H29xoLYQNRyCMAa6L+NzWH6pMu3ANS8BlgD5f4pHXp+R7CJV3ObsJbEJsFNmNBDuGMeghfnMl/qv0QTjmuJB47IBNCFn/V84Ah/kg5D4+fH496yCgX20IeBmgvGH4nvnWMoyvNp9Mg7TawiNcJb5GiWOYBjGguGpW7kkDngXH/Wwaor5rF1wXGufsXmAXbKPIbqSqBji//2qb5Lc9n9pxVyQ3lsKjOBeWrCa8NiFZ1Rd61RkBGGCdfSCN1p1KbUIKb/zmIiLFFBwRXLqqVWoNiJcR0mUHNestpuCaoUfDIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACtSLwP6Czgs+F0YmMAAAAAElFTkSuQmCC",
	load: async function() {
		var promsArr = [];
		var keys = Object.keys(this);
		keys.splice(keys.indexOf("load"), 1);
		keys.forEach(function(key) {
			var src = Assets[key];
			var fileExtension = src.startsWith("data:")? src.match(/data:[a-zA-Z]+\/([a-zA-Z]+)/)[1] : src.match(/[a-zA-Z]+$/).toString();
			var fileType = "unknown";
			switch(fileExtension) {
				case "png":
				case "jpg":
				case "svg":
					fileType = "image";
					break;
				case "mp3":
				case "wav":
				case "ogg":
					fileType = "audio";
					break;
				default: break;
			}
			var el;
			switch(fileType) {
				case "image":
					el = document.createElement("img");
					break;
				case "audio":
					el = document.createElement("audio");
					break;
				default: break;
			}
			promsArr.push(new Promise(function(callback, error) {
				el.onload = callback;
				el.onerror = error;
			}));
			el.src = src;
			delete Assets[key]; // Because I can't change the data type from a string to an object
			Assets[key] = el;
		});
		var ultimateAssetPromise = Promise.all(promsArr);
		await ultimateAssetPromise;
	}
};

window.addEventListener("load", async function() {
	can = selectEl("canvas");
	ctx = can.getContext("2d");
	
	joystickEl = selectEl(".joystick");
	joystickCenter = selectEl(".joystickCenter");
	
	await init();
	loop();
});
async function init() {
	window.addEventListener("keydown", function(e) {
		var key = e.key.toLowerCase();
		if(keyStates.indexOf(key) == -1) {
			keyStates.push(key);
		}
	});
	window.addEventListener("keyup", function(e) {
		var key = e.key.toLowerCase();
		keyStates.splice(keyStates.indexOf(key), 1);
	});
	can.addEventListener("click", function(e) {
		var canDims = can.getBoundingClientRect();
		var x = (e.clientX - canDims.x) / canDims.width * 500;
		var y = (e.clientY - canDims.y) / canDims.height * 500;
		console.log(x, y);
	});
	ctx.textBaseline = "top";
	ctx.imageSmoothingEnabled = false;
	
	var joystickMoveFunc = function(e) {
		var joystickDims = joystickEl.getBoundingClientRect();
		var joystickScale = joystickDims.width / 200;
		var x = (e.targetTouches[0].clientX - joystickDims.x) / joystickScale - 100;
		var y = (e.targetTouches[0].clientY - joystickDims.y) / joystickScale - 100;
		var a = -atan2(x, y) + 90;
		var dis = hypot(x, y);
		if(dis > 100 * joystickScale || dis < -100 * joystickScale) {
			x = cos(a) * 100 * joystickScale;
			y = sin(a) * 100 * joystickScale;
		}
		joystickCenter.style.transform = `translate(${x}px, ${y}px)`;
		joystick.x = x;
		joystick.y = y;
		joystick.a = a;
		e.preventDefault();
		e.stopPropagation();
		return false;
	};
	joystickEl.addEventListener("touchstart", joystickMoveFunc);
	joystickEl.addEventListener("touchmove", joystickMoveFunc);
	joystickEl.addEventListener("touchend", function() {
		joystickCenter.style.transform = "none";
		joystick.x = 0;
		joystick.y = 0;
		joystick.a = 0;
	});
	
	await Assets.load();
	await generateLevel();
}
function loop() {
	update();
	draw();
	
	window.requestAnimationFrame(loop);
}
function update() {
	var goingUp = keyStates.includes("w") || joystick.y < -30;
	var canJump = player.jumps < player.maxJumps && getTime() - player.lastJumpTime >= player.jumpInterval;
	var canJump2 = player.v.y > 0? player.jumps > 0 : true;
	if(goingUp && canJump && canJump2) {
		player.v.y = -10;
		player.jumps++;
		player.lastJumpTime = getTime();
	}
	var goingLeft = keyStates.includes("a") || joystick.x < -30;
	var goingRight = keyStates.includes("d") || joystick.x > 30;
	if(goingLeft && !goingRight) {
		player.v.x = -3;
	} else if(goingRight && !goingLeft) {
		player.v.x = 3;
	} else {
		player.v.x = 0;
	}
	
	player.absPos.x += player.v.x;
	player.absPos.x = max(min(player.absPos.x, level.map.length * 40 - player.size.width), 0);
	if(player.checkForCollision()) {
		var direction = player.v.x / abs(player.v.x);
		player.direction = direction;
		while(player.checkForCollision()) {
			player.absPos.x -= direction;
		}
	}
	
	player.v.y += level.gravity;
	player.absPos.y += player.v.y;
	player.absPos.y = max(min(player.absPos.y, level.map[0].length * 40 - player.size.height), 0);
	if(player.checkForCollision()) {
		var direction = player.v.y / abs(player.v.y);
		direction /= 2;
		player.direction = direction;
		while(player.checkForCollision()) {
			player.absPos.y -= direction;
		}
		player.v.y = 0;
		player.jumps = 0;
	}
	
	calculateScroll();
}
function draw() {
	ctx.clearRect(0, 0, can.width, can.height);
	
	drawLevel();
	player.draw();
	
	ctx.font = "32px VT323, Monospace";
	ctx.fillText("©SuperLlama88888 2020", 5, can.height - 35);
}

async function generateLevel() {
	var biomes = [Biomes.PLAINS, Biomes.DESERT];
	var biome = random(biomes);
	var biomeLength = 0;
	var biomeHistory = [];
	var biomeStartX = 0;
	var groundHeight = ~~(level.map[0].length / 2);
	for(var x = 0; x < level.map.length; x++) {
		if(x == ~~(level.map.length / 2)) {
			player.absPos.x = x * 40 + 4;
			player.absPos.y = groundHeight * 40 - 160;
		}
		for(var y = 0; y < groundHeight; y++) {
			level.map[x][y] = Blocks.AIR;
		}
		switch(biome) {
			case Biomes.PLAINS:
				level.map[x][y++] = Blocks.DIRT_WITH_GRASS;
				var howMuchDirt = random(2, 6);
				for(; y < groundHeight + howMuchDirt; y++) {
					level.map[x][y] = Blocks.DIRT;
				}
				for(; y < level.map[0].length; y++) {
					level.map[x][y] = Blocks.STONE;
				}
				break;
			case Biomes.DESERT:
				var howMuchSand = random(2, 6);
				for(; y < groundHeight + howMuchSand; y++) {
					level.map[x][y] = Blocks.SAND;
				}
				for(; y < level.map[0].length; y++) {
					level.map[x][y] = Blocks.SANDSTONE;
				}
				break;
			default: break;
		}
		var t = random(0, 4);
		if(t == 0 && groundHeight < level.map[0].length - 1) {
			groundHeight++;
		} else if(t == 1 && groundHeight > 1) {
			groundHeight--;
		}
		biomeHistory.push(biome);
		biomeLength++;
		if(biomeLength >= 20 && !random(30)) {
			while(biome == (biome = random(biomes))) {}
			biomeStartX = x;
			biomeLength = 0;
		}
	}
	var lastTreeX = -1;
	for(x = 0; x < level.map.length; x++) {
		if(biomeHistory[x] == Biomes.PLAINS && !random(8) && x - lastTreeX > 2 && x > 0 && x < level.map.length - 1) {
			for(y = 0; level.map[x][y] == Blocks.AIR; y++) {}
			groundHeight = y--;
			var treeHeight = random(2, 4);
			var treeType = random(["OAK", "BIRCH"]);
			for(; y > groundHeight - treeHeight; y--) {
				level.map[x][y] = Blocks[`${treeType}_LOG`];
			}
			level.map[x - 1][--y - 1] = Blocks.LEAF_UPPER_LEFT;
			level.map[x][y - 1] = Blocks.LEAF_UPPER_MIDDLE;
			level.map[x + 1][y - 1] = Blocks.LEAF_UPPER_RIGHT;
			level.map[x - 1][y] = Blocks.LEAF_MIDDLE_LEFT;
			level.map[x][y] = Blocks.LEAF_MIDDLE_MIDDLE;
			level.map[x + 1][y] = Blocks.LEAF_MIDDLE_RIGHT;
			level.map[x - 1][y + 1] = Blocks.LEAF_BOTTOM_LEFT;
			level.map[x][y + 1] = Blocks[`${treeType}_LEAF_BOTTOM_MIDDLE`];
			level.map[x + 1][y + 1] = Blocks.LEAF_BOTTOM_RIGHT;
			lastTreeX = x;
		} else if(biomeHistory[x] == Biomes.DESERT && !random(10)) {
			for(y = 0; level.map[x][y] == Blocks.AIR; y++) {}
			groundHeight = y--;
			var cactusHeight = random(1, 5);
			for(; y > groundHeight - cactusHeight; y--) {
				level.map[x][y] = Blocks.CACTUS;
			}
		}
	}
}
function drawLevel() {
	for(var x = 0; x < level.map.length; x++) {
		for(var y = 0; y < level.map[0].length; y++) {
			var block = level.map[x][y];
			var srcX = (block % 8) * 20;
			var srcY = ~~(block / 8) * 20;
			ctx.drawImage(Assets.blockSpritesheet, srcX, srcY, 20, 20, x * 40 - level.scrollOffset.x, y * 40 - level.scrollOffset.y, 40, 40);
		}
	}
}
function calculateScroll() {
	level.scrollOffset.x = max(min(player.absPos.x - (500 - player.size.width / 2), level.map.length * 40 - 1000), 0);
	player.relPos.x = player.absPos.x - level.scrollOffset.x;
	level.scrollOffset.y = max(min(round(player.absPos.y) - (500 - player.size.height / 2), level.map[0].length * 40 - 1000), 0);
	player.relPos.y = player.absPos.y - level.scrollOffset.y;
}
