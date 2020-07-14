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
	map: Array2D(64, 300),
	scrollOffset: {
		x: 0,
		y: 0
	},
	gravity: 0.5,
	seed: Math.seed
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
	isUnderBlock: false,
	draw: function() {
		ctx.drawImage(Assets.playerImg, this.relPos.x, this.relPos.y, this.size.width, this.size.height);
	},
	checkForCollision: function() {
		if(this.absPos.y < 0) {
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
	COAL_ORE: 18,
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
	[Blocks.OAK_LEAF_BOTTOM_MIDDLE]: 0,
	[Blocks.BIRCH_LEAF_BOTTOM_MIDDLE]: 0,
	[Blocks.LEAF_BOTTOM_RIGHT]: 0,
	[Blocks.CACTUS]: 0,
	[Blocks.COAL_ORE]: 1,
	[Blocks.AIR]: 0
};
var Biomes = {
	PLAINS: 0,
	DESERT: 1
};

var Assets = {
	playerImg: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAFKADAAQAAAABAAAAFAAAAACy3fD9AAAAd0lEQVQ4EWPsP/vrPwMVARMVzQIbNfgNZIF5udCYDcz8/x8SpBPO/YZJYaULjFhRxGHqaedlkMtgrkOxmgCHkZGRAYRhgOouZBxNhwyw5AMLZHw0NrVUj5TBbyA86yGHFbawQZbHx8YwEJgu8aknKDf4w5DqLgQALKgaK3rS1oEAAAAASUVORK5CYII=",
	blockSpritesheet: "data:image/png;base64,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eJKjvE/wrPN+gbxnkH7ZdS/DFFmbxRA0Nr08EzxEUE72htgfBik1R7kj9r3dZONNdo85pu6gEen/EyKp+YPlQbmY6iHWAALV9oD1H1LRO2Sss+AtW7Z4HZDJH4G6GuDK4Yc8Qu8u+rOX92WKkyWLt+J8+lFoKgJ1NUDbMzeXXVO3nJxICNsjmrLIN5ZA2FlwY0cVcnT9P0IkDQtyAnLlyhUnBk9GwvqgvnEEauUBKz6MELrsVpm/3l6rIuY04wQkDqXmkamVAVo9Cx4bG6NDhw451JYuXdo89DCSzARqZYCZB2YqWLdunVlEHgRAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAAQyEfg/vb7/m/Q59UoAAAAASUVORK5CYII=",
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
		var x = (e.clientX - canDims.x) / canDims.width * 1000;
		var y = (e.clientY - canDims.y) / canDims.height * 1000;
		var blockX = ~~((x + level.scrollOffset.x) / 40);
		var blockY = ~~((y + level.scrollOffset.y) / 40);
		level.map[blockX][blockY] = Blocks.AIR;
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
	var canJump2 = player.v.y > 0? player.jumps > 0 : true && !player.isUnderBlock;
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
	player.absPos.y = min(player.absPos.y, level.map[0].length * 40 - player.size.height);
	if(player.absPos.y <= 0) {
		player.v.y = 0;
		player.absPos.y = 0;
	}
	if(player.checkForCollision()) {
		if(player.v.y < 0) {
			player.isUnderBlock = true;
		} else {
			player.isUnderBlock = false;
		}
		var direction = player.v.y / abs(player.v.y);
		direction /= 2;
		player.direction = direction;
		while(player.checkForCollision()) {
			player.absPos.y -= direction;
		}
		player.v.y = 0;
		player.jumps = 0;
		player.lastJumpTime = 0;
	}
	
	calculateScroll();
}
function draw() {
	ctx.clearRect(0, 0, can.width, can.height);
	
	drawLevel();
	player.draw();
	
	ctx.font = "32px VT323, Monospace";
	ctx.fillText("©Rowsej 2020", 5, can.height - 35);
	
	ctx.fillText(JSON.stringify({ playerUnderBlock: player.isUnderBlock, worldSeed: level.seed, playerPos: player.absPos }), 0, 0);
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
				var howMuchDirt = min(random(3, 7), level.map[0].length - groundHeight);
				for(; y < groundHeight + howMuchDirt; y++) {
					level.map[x][y] = Blocks.DIRT;
				}
				for(; y < level.map[0].length; y++) {
					level.map[x][y] = Blocks.STONE;
				}
				break;
			case Biomes.DESERT:
				var howMuchSand = min(random(2, 6), level.map[0].length - groundHeight);
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
		if(t == 0 && groundHeight < level.map[0].length * 0.75) {
			groundHeight++;
		} else if(t == 1 && groundHeight > level.map[0].length * 0.25) {
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
	var currentBiome = biomeHistory[0];
	for(x = 0; x < level.map.length; x++) {
		if(currentBiome != biomeHistory[x]) {
			var biomeA = currentBiome;
			var biomeB = biomeHistory[x];
			var biomeSplitX = x - 1;
			for(y = 0; y < level.map[0].length; y++) {
				var biomeABlock = level.map[x - 1][y];
				var biomeBBlock = level.map[min(x + 1, level.map.length)][y];
				for(var tempX = x - 3; tempX < x + 2; tempX++) {
					if(level.map[tempX][y] == Blocks.AIR) {
						continue;
					}
					if(tempX < biomeSplitX) {
						level.map[tempX][y] = biomeABlock;
					} else {
						level.map[tempX][y] = biomeBBlock;
					}
				}
				var t = random(0, 4);
				if(t == 0 && biomeSplitX < x + 2) {
					biomeSplitX++;
				} else if(t == 1 && biomeSplitX > x - 2) {
					biomeSplitX--;
				}
			}
			currentBiome = biomeHistory[x];
		}
	}
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
	for(x = 0; x < level.map.length; x++) {
		for(y = 0; y < level.map[0].length; y++) {
			if(level.map[x][y] == Blocks.DIRT && !Opacity[level.map[x][y - 1]]) {
				level.map[x][y] = Blocks.DIRT_WITH_GRASS;
			}
		}
	}
	for(var n = 0; n < level.map.length * level.map[0].length / 300; n++) {
		var veinX = random(0, level.map.length);
		var veinY = random(~~(level.map[0].length * 0.75), level.map[0].length);
		var veinSize = random(1, 6);
		for(var t = 0; t < veinSize; t++) {
			level.map[veinX][veinY] = Blocks.COAL_ORE;
			var w = random(0, 4);
			if(w == 0 && veinX < level.map.length - 1) {
				veinX++;
			} else if(w == 1 && veinX > 0) {
				veinX--;
			} else if(w == 2 && veinY < level.map[0].length - 1) {
				veinY++;
			} else if(w == 3 && veinY > 0) {
				veinY--;
			}
		}
	}
}
function drawLevel() {
	var startX = ~~(level.scrollOffset.x / 40);
	var endX = min(~~(level.scrollOffset.x / 40) + 26, level.map.length);
	var startY = ~~(level.scrollOffset.y / 40);
	var endY = ~~(level.scrollOffset.y / 40) + 26;
	for(var x = startX; x < endX; x++) {
		for(var y = startY; y < endY; y++) {
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
