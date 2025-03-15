const board = document.getElementById('gameBoard');
const scoreElement = document.getElementById('scoreValue');
const finalScoreElement = document.getElementById('finalScore');
const gameOverScreen = document.getElementById('gameOver');
const size = 15;
let snake = [{x: 7, y: 7}];
let food = {x: 5, y: 5};
let direction = 'right';
let score = 0;
let gameLoop;
let touchStartX = 0;
let touchStartY = 0;

// Create the game board
function initializeBoard() {
    for (let y = 0; y < size; y++) {
        const row = board.insertRow();
        for (let x = 0; x < size; x++) {
            row.insertCell();
        }
    }
}

function updateGame() {
    // Clear board
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            board.rows[y].cells[x].className = '';
        }
    }

    // Draw snake
    snake.forEach((segment) => {
        if (segment.x >= 0 && segment.x < size && segment.y >= 0 && segment.y < size) {
            board.rows[segment.y].cells[segment.x].className = 'snake';
        }
    });

    // Draw food
    board.rows[food.y].cells[food.x].className = 'food';
}

function moveSnake() {
    const head = {...snake[0]};

    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    // Check collision with walls
    if (head.x < 0 || head.x >= size || head.y < 0 || head.y >= size) {
        gameOver();
        return;
    }

    // Check collision with self
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // Check if snake ate food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        generateFood();
    } else {
        snake.pop();
    }

    updateGame();
}

function generateFood() {
    do {
        food.x = Math.floor(Math.random() * size);
        food.y = Math.floor(Math.random() * size);
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function gameOver() {
    clearInterval(gameLoop);
    finalScoreElement.textContent = score;
    gameOverScreen.style.display = 'flex';
    setTimeout(() => gameOverScreen.classList.add('visible'), 0);
}

function resetGame() {
    snake = [{x: 7, y: 7}];
    direction = 'right';
    score = 0;
    scoreElement.textContent = score;
    generateFood();
    gameOverScreen.classList.remove('visible');
    setTimeout(() => gameOverScreen.style.display = 'none', 300);
    gameLoop = setInterval(moveSnake, 150);
}

function changeDirection(newDirection) {
    // Prevent 180-degree turns
    const opposites = {
        'up': 'down', 'down': 'up',
        'left': 'right', 'right': 'left'
    };
    if (opposites[newDirection] !== direction) {
        direction = newDirection;
    }
}

// Handle keyboard controls
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        const directionMap = {
            'w': 'up', 'arrowup': 'up',
            's': 'down', 'arrowdown': 'down',
            'a': 'left', 'arrowleft': 'left',
            'd': 'right', 'arrowright': 'right'
        };
        
        if (directionMap[key]) {
            e.preventDefault(); // Prevent page scroll on arrow keys
            changeDirection(directionMap[key]);
        }
    });
}

// Handle touch controls
function setupTouchControls() {
    // Button controls
    document.getElementById('upBtn').addEventListener('click', () => changeDirection('up'));
    document.getElementById('downBtn').addEventListener('click', () => changeDirection('down'));
    document.getElementById('leftBtn').addEventListener('click', () => changeDirection('left'));
    document.getElementById('rightBtn').addEventListener('click', () => changeDirection('right'));

    // Swipe controls
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, false);

    document.addEventListener('touchmove', (e) => {
        if (!touchStartX || !touchStartY) return;

        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Require a minimum swipe distance to trigger direction change
        const minSwipeDistance = 30;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > minSwipeDistance) {
                changeDirection(deltaX > 0 ? 'right' : 'left');
            }
        } else {
            if (Math.abs(deltaY) > minSwipeDistance) {
                changeDirection(deltaY > 0 ? 'down' : 'up');
            }
        }
        
        // Reset touch start coordinates
        touchStartX = touchEndX;
        touchStartY = touchEndY;
        
        // Prevent page scrolling while playing
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', () => {
        touchStartX = 0;
        touchStartY = 0;
    }, false);
}

// Prevent zooming on double tap
document.addEventListener('dblclick', (e) => {
    e.preventDefault();
}, { passive: false });

// Initialize game
function init() {
    initializeBoard();
    setupKeyboardControls();
    setupTouchControls();
    resetGame();
}

// Start the game when the page loads
window.addEventListener('load', init);
