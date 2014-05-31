var a, c, w, h, squares;

var SQUARES_X_COUNT = 75;
var SQUARES_Y_COUNT = 30;
var SQUARE_SIZE = 7;
var SQUARE_INTERSECTION = 1;
var MOUSE_INFLUENCE_RADIUS = 100;
var mouse = {
	strength: 30,
	x: 0,
	y: 0,
	getX: function(event) {
		if(event.offsetX) {
			return event.offsetX;
		}
		if(event.clientX) {
			return event.clientX - canvas.offsetLeft;
		}
		return null;
	},
	getY: function(event) {
		if(event.offsetY) {
			// chrome and IE
			return event.offsetY;
		}
		if(event.clientY) {
			// Firefox
			return event.clientY - canvas.offsetTop;
		}
		return null;    
	}
};

var render = function() {
	a.fillStyle = "#333";
	a.fillRect(0, 0, w, h);

	a.save();
	a.globalCompositeOperation = "lighter";
	for(var i = 0; i < squares.length; i++) {
		a.fillStyle = squares[i].color;
		a.fillRect(squares[i].x, squares[i].y, SQUARE_SIZE + SQUARE_INTERSECTION, SQUARE_SIZE + SQUARE_INTERSECTION);
	}
	a.restore();
};

var initialize = function() {
	squares = new Array();
	var startX = (w/2) - ((SQUARES_X_COUNT * SQUARE_SIZE)/2);
	var startY = (h/2) - ((SQUARES_Y_COUNT * SQUARE_SIZE)/2);

	for(var i = 0; i < SQUARES_X_COUNT; i++) {
		for(var j = 0; j < SQUARES_Y_COUNT; j++) {
			squares.push({
				indexX: i,
				indexY: j,
				originX: startX + (i * SQUARE_SIZE),
				originY: startY + (j * SQUARE_SIZE),
				x: startX + (i * SQUARE_SIZE),
				y: startY + (j * SQUARE_SIZE),
				color: "rgba(0,100,0,1)"
			});
		}
	}
};

var loadLogo = function() {
	for(var i = 0; i < squares.length; i++) {
		for(var j = 0; j < logoPixels.length; j++) {
			if(squares[i].indexX == logoPixels[j].x && squares[i].indexY == logoPixels[j].y) {
				squares[i].color = "rgba(200,200,200,1)";
			}
		}
	}
};

var recomputeGeometry = function() {
	for(var i = 0; i < squares.length; i++) {
		var deltaMouseX = squares[i].x - mouse.x;
		var deltaMouseY = squares[i].y - mouse.y;
		var distanceToMouse = Math.sqrt(Math.pow(deltaMouseX, 2) + Math.pow(deltaMouseY, 2))

		if(distanceToMouse < MOUSE_INFLUENCE_RADIUS) {
			// Move point away from Mouse
			var moveAngle = Math.atan2(deltaMouseY, deltaMouseX);
			var exponent = (mouse.strength / distanceToMouse);

			squares[i].x += Math.cos(moveAngle) * exponent;
			squares[i].y += Math.sin(moveAngle) * exponent;
		} else {
			var deltaOriginX = squares[i].originX - squares[i].x;
			var deltaOriginY = squares[i].originY - squares[i].y;
			var distanceToOrigin = Math.sqrt(Math.pow(deltaOriginX, 2) + Math.pow(deltaOriginY, 2))

			// Move towards origin
			var moveAngle = Math.atan2(deltaOriginY, deltaOriginX);
			var exponent = (30 / distanceToOrigin);

			squares[i].x += Math.cos(moveAngle) / exponent;
			squares[i].y += Math.sin(moveAngle) / exponent;
		}
	}
};

var step = function() {
	recomputeGeometry();
	render();
};

window.onload = function() {
	c = document.getElementById('canvas');
	a = c.getContext('2d');
	w = c.width;
	h = c.height;

	c.onmousemove = function(e) {
		mouse.x = mouse.getX(e);
		mouse.y = mouse.getY(e);
	};

	c.onmousedown = function(e) {
		mouse.strength = 150;
	}

	c.onmouseup = function(e) {
		mouse.strength = 20;
	}

	c.addEventListener("mouseout", function(e) {
		mouse.strength = 20;
		mouse.x = 0;
		mouse.y = 0;
	}, false);

	initialize();
	loadLogo();
	setInterval(step, 5);
}
