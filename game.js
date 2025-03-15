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

// Handle keyboard controls
function setupControls() {
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        const newDirection = {
            'w': 'up', 'arrowup': 'up',
            's': 'down', 'arrowdown': 'down',
            'a': 'left', 'arrowleft': 'left',
            'd': 'right', 'arrowright': 'right'
        }[key];

        if (newDirection) {
            // Prevent 180-degree turns
            const opposites = {
                'up': 'down', 'down': 'up',
                'left': 'right', 'right': 'left'
            };
            if (opposites[newDirection] !== direction) {
                direction = newDirection;
            }
        }
    });
}

// Initialize game
function init() {
    initializeBoard();
    setupControls();
    resetGame();
}

// Start the game when the page loads
window.addEventListener('load', init);
