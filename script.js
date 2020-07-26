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
var fps = 0, frames = 0, lastFpsUpdateTime = 0;
var joystickEl, joystickCenter;
var joystick = {
	x: 0,
	y: 0,
	a: 0
};

var keyStates = [];

var level = {	
	map: Array2D(64, 300),
	lighting: Array2D(64, 300),
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
	blockSpritesheet: "data:image/png;base64,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yv7ODFKGcZlEspdvYw9Xi69RWr0NI1jlXuDY2JiPsBw2Khmg1Jn7QTPvU4BCwwm0RX62G2+o8Z4xR9Ct9wJNUf1/QiQ1/2A5DM6k1Nz5anvA+o8+710y0il4x44dXgdkskegrgbYM/SgR+jU8r94eV8mXywZj+J87SjMKAJ1NUDb5Mxl19Sth5VKy7Yph3zjCQSdghs/sgoj0P8jRNKgIAcQOaxIrHRACeqH+sYQqJUHrHgKDlx2q8xdH69VEXOagw4g5SfjKLogU3sCtTJAq6fg8fFxOnr0qENj1apViagEGWYiZehkjUCtDNDaAEXRpk2brOqDMhAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAARAAgdlN4P8WrBIeV+93dgAAAABJRU5ErkJggg==",
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
		if(hypot(player.relPos.x + player.size.width / 2 - x, player.relPos.y + player.size.height / 2 - y) > 200) {
			return;
		}
		var blockX = ~~((x + level.scrollOffset.x) / 40);
		var blockY = ~~((y + level.scrollOffset.y) / 40);
		if(level.map[blockX][blockY] == Blocks.AIR) {
			level.map[blockX][blockY] = Blocks.STONE;
		} else {
			level.map[blockX][blockY] = Blocks.AIR;
		}
	});
	ctx.textBaseline = "top";
	ctx.imageSmoothingEnabled = false;
	ctx.font = "32px VT323, Monospace";
	
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
	calculateLighting();
	
	lastFpsUpdateTime = getTime();
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
	if(player.v.y > 0) {
		player.isUnderBlock = false;
	}
	player.absPos.y += player.v.y;
	var maxY = level.map[0].length * 40 - player.size.height;
	if(player.absPos.y > maxY) {
		player.absPos.y = maxY;
		player.v.y = 0;
	}
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
	
	calculateLighting();
	calculateScroll();
}
function draw() {
	ctx.clearRect(0, 0, can.width, can.height);
	
	drawLevel();
	player.draw();
	
	frames++;
	if(getTime() - lastFpsUpdateTime >= 1000) {
		fps = frames;
		frames = 0;
		lastFpsUpdateTime = getTime();
	}
	ctx.fillStyle = "black";
	ctx.textAlign = "right";
	ctx.fillText(`FPS: ${fps}`, can.width, 0);
	
	ctx.textAlign = "left";
	ctx.fillText("©Rowsej 2020", 5, can.height - 35);
	
	ctx.fillText(JSON.stringify({ worldSeed: level.seed, playerPos: player.absPos }), 0, 0);
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
	for(var n = 0; n < level.map.length * level.map[0].length / 50; n++) {
		var veinX = random(0, level.map.length);
		var veinY = random(0, level.map[0].length);
		var veinSize = random(1, 6);
		for(var t = 0; t < veinSize; t++) {
			if(level.map[veinX][veinY] == Blocks.STONE) {
				level.map[veinX][veinY] = Blocks.COAL_ORE;
			}
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
function calculateLighting() {
	for(var x = 0; x < level.map.length; x++) {
		for(var y = 0; !Opacity[level.map[x][y]]; y++) {
			level.lighting[x][y] = 1;
		}
		var groundLevel = y;
		for(; y < level.map[0].length; y++) {
			level.lighting[x][y] = max(1 - 0.1 * (y - groundLevel), 0);
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
			var xPos = x * 40 - level.scrollOffset.x;
			var yPos = y * 40 - level.scrollOffset.y;
			ctx.drawImage(Assets.blockSpritesheet, srcX, srcY, 20, 20, xPos, yPos, 40, 40);
			var lighting = level.lighting[x][y];
			ctx.fillStyle = `rgba(0, 0, 0, ${1 - lighting})`;
			ctx.fillRect(xPos, yPos, 40, 40);
		}
	}
}
function calculateScroll() {
	level.scrollOffset.x = max(min(player.absPos.x - (500 - player.size.width / 2), level.map.length * 40 - 1000), 0);
	player.relPos.x = player.absPos.x - level.scrollOffset.x;
	level.scrollOffset.y = max(min(round(player.absPos.y) - (500 - player.size.height / 2), level.map[0].length * 40 - 1000), 0);
	player.relPos.y = player.absPos.y - level.scrollOffset.y;
}
