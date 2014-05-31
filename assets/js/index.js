var a, c, w, h, squares;

var SQUARES_X_COUNT = 75;
var SQUARES_Y_COUNT = 30;
var SQUARE_SIZE = 9;
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

var isRunningSnake = false;
var snakeMovement = 'right';
var snakeBodySquareIndexes = new Array();
var snakeFoodSquareIndex = -1;
var snakeInterval = null;

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
				color: "rgba(0,0,100,1)"
			});
		}
	}
};

var squareIndexForPixel = function(x, y) {
	for(var i = 0; i < squares.length; i++) {
		if(squares[i].indexX == x && squares[i].indexY == y) {
			return i;
		}
	}
	
	return null;
};

var setPixelColor = function(x, y, isWhite) {
	var squareIndex = squareIndexForPixel(x, y);
	squares[squareIndex].color = (isWhite ? "rgba(150,150,150,1)" : "rgba(0,0,100,1)");
};

var loadLogo = function() {
	for(var i = 0; i < logoPixels.length; i++) {
		setPixelColor(logoPixels[i].x, logoPixels[i].y, true);
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

var insertSnakeFood = function() {
	var squareIsSnakeBody = function(x, y) {
		for(var i = 0; i < snakeBodySquareIndexes.length; i++) {
			if(squares[snakeBodySquareIndexes[i]].indexX == x && squares[snakeBodySquareIndexes[i]].indexY == y) {
				return true;
			}
		}
		
		return false;
	};

	var x = null;
	var y = null;
	snakeFoodSquareIndex = null;

	while(squareIsSnakeBody(x, y) || (x == null || y == null || snakeFoodSquareIndex == null)) {
		x = Math.floor(Math.random() * SQUARES_X_COUNT) + 1;
		y = Math.floor(Math.random() * SQUARES_Y_COUNT) + 1;
		snakeFoodSquareIndex = squareIndexForPixel(x, y);
	}
};

var isPixelColliding = function(x, y) {
	if(x > SQUARES_X_COUNT - 1 || x < 0 || y > SQUARES_Y_COUNT - 1 || y < 0) {
		return true;
	}

	var squareCollides = function(square) {
		return (square.indexX == x && square.indexY == y);
	}

	for(var i = 0; i < snakeBodySquareIndexes.length; i++) {
		if(squareCollides(squares[snakeBodySquareIndexes[i]])) {
			return true;
		}
	}

	return false;
};

var clearPixels = function() {
	for(var i = 0; i < squares.length; i++) {
		// Set all squares white
		setPixelColor(squares[i].indexX, squares[i].indexY, false);
	}
};

var endSnake = function() {
	isRunningSnake = false;
	clearInterval(snakeInterval);

	var isBodyWhite	= true;
	var flashesCount = 0;

	var flashBody = function() {
		for(var i = 0; i < snakeBodySquareIndexes.length; i++) {
			setPixelColor(squares[snakeBodySquareIndexes[i]].indexX, squares[snakeBodySquareIndexes[i]].indexY, isBodyWhite);
		}

		setPixelColor(squares[snakeFoodSquareIndex].indexX, squares[snakeFoodSquareIndex].indexY, isBodyWhite);

		flashesCount++;

		setTimeout(function(){
			if(flashesCount < 10) {
				isBodyWhite = !isBodyWhite;
				flashBody();
			} else {
				snakeBodySquareIndexes = new Array();
				clearPixels();
				loadLogo();
			}
		}, 75);
	};

	flashBody();
}

var moveSnake = function() {
	var currentHeadSquare = squares[snakeBodySquareIndexes[0]];
	var deltaX = 0;
	var deltaY = 0;

	if(snakeMovement == 'up') {
		deltaX = 0;
		deltaY = -1;
	} else if(snakeMovement == 'down') {
		deltaX = 0;
		deltaY = 1;
	} else if(snakeMovement == 'left') {
		deltaX = -1;
		deltaY = 0;
	} else if(snakeMovement == 'right') {
		deltaX = 1;
		deltaY = 0;
	}

	// Put new head
	var headX = currentHeadSquare.indexX + deltaX;
	var headY = currentHeadSquare.indexY + deltaY;

	if(isPixelColliding(headX, headY)) {
		endSnake();
		return;
	}

	// Check collision with food
	if(headX == squares[snakeFoodSquareIndex].indexX && headY == squares[snakeFoodSquareIndex].indexY) {
		insertSnakeFood();
	} else {
		// Remove tail
		snakeBodySquareIndexes.pop();
	}

	// Create new head
	var newHead = squareIndexForPixel(headX, headY);
	snakeBodySquareIndexes.unshift(newHead);

	// Clear all white pixels
	clearPixels();

	// Draw food
	setPixelColor(squares[snakeFoodSquareIndex].indexX, squares[snakeFoodSquareIndex].indexY, true);

	// Draw snake body
	for(var j = 0; j < snakeBodySquareIndexes.length; j++) {
		setPixelColor(squares[snakeBodySquareIndexes[j]].indexX, squares[snakeBodySquareIndexes[j]].indexY, true);
	}
};

var startSnake = function() {
	snakeMovement = 'right';
	isRunningSnake = true;

	// Set snake body
	for(var i = 10; i >= 5; i--) {
		snakeBodySquareIndexes.push(squareIndexForPixel(i, Math.round(SQUARES_Y_COUNT/2)));
	}

	insertSnakeFood();

	snakeInterval = setInterval(moveSnake, 50);
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
		mouse.strength = 10;
	}

	c.addEventListener("mouseout", function(e) {
		mouse.strength = 10;
		mouse.x = 0;
		mouse.y = 0;
	}, false);

	document.onkeypress = function(e) {
		if(e.charCode == 107 || e.charCode == 119) {
			snakeMovement = 'up';
			if(!isRunningSnake) startSnake();
		} else if(e.charCode == 106 || e.charCode == 115) {
			snakeMovement = 'down';
			if(!isRunningSnake) startSnake();
		} else if(e.charCode == 104 || e.charCode == 97) {
			snakeMovement = 'left';
			if(!isRunningSnake) startSnake();
		} else if(e.charCode == 108 || e.charCode == 100) {
			snakeMovement = 'right';
			if(!isRunningSnake) startSnake();
		}
	}

	initialize();
	loadLogo();
	setInterval(step, 5);
};
