// Constants
const MAX_HIGH_SCORES = 10;
const GAME_SPEED = 150; // milliseconds between moves
const size = 15;

// Game variables
let snake = [];
let food = { x: 0, y: 0 };
let direction = 'right';
let score = 0;
let gameLoop = null;
let touchStartX = 0;
let touchStartY = 0;
let highScores = [];
let globalScores = [];
let currentView = 'global';
let playerName = localStorage.getItem('playerName') || '';
let isPaused = false;

// Firebase variables
let database;
let scoresRef;

// Initialize Firebase and Database
console.log('Current hostname:', window.location.hostname);
console.log('Initializing Firebase with config:', { ...window.firebaseConfig, apiKey: '***' });

try {
    firebase.initializeApp(window.firebaseConfig);
    database = firebase.database();
    scoresRef = database.ref('/scores');
    console.log('Firebase initialized successfully');

    // Test database connection
    scoresRef.once('value')
        .then(snapshot => {
            console.log('Database connection successful');
            console.log('Current scores:', snapshot.val());
        })
        .catch(error => {
            console.error('Database connection error:', error);
        });

    // Listen for global score changes
    scoresRef.orderByChild('score')
        .limitToLast(MAX_HIGH_SCORES)
        .on('value', (snapshot) => {
            globalScores = [];
            snapshot.forEach((childSnapshot) => {
                globalScores.push(childSnapshot.val());
            });
            globalScores.sort((a, b) => b.score - a.score);
            console.log('Global scores updated:', globalScores);
            if (currentView === 'global') {
                updateHighScoresDisplay();
            }
        }, error => {
            console.error('Error listening to scores:', error);
        });
} catch (error) {
    console.error('Firebase initialization error:', error);
}

const board = document.getElementById('gameBoard');
const scoreElement = document.getElementById('scoreValue');
const lastScoreElement = document.getElementById('lastScore');
const lastScoreValueElement = document.getElementById('lastScoreValue');
const scoresList = document.getElementById('scoresList');
const nameInput = document.getElementById('nameInput');
const playerNameInput = document.getElementById('playerName');
const localTab = document.getElementById('localTab');
const globalTab = document.getElementById('globalTab');

// Ask for player name if not set
function askPlayerName() {
    if (!playerName) {
        nameInput.style.display = 'flex';
        playerNameInput.value = ''; // Clear any previous input
        playerNameInput.focus();
        
        // Pause the game
        isPaused = true;
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        
        // Handle Enter key press
        playerNameInput.onkeydown = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitPlayerName();
            }
        };

        // Remove any previous event listeners
        playerNameInput.oninput = null;
        playerNameInput.onkeyup = null;
        
        return false;
    }
    return true;
}

// Submit player name
function submitPlayerName() {
    const name = playerNameInput.value.trim();
    if (name) {
        playerName = name;
        localStorage.setItem('playerName', playerName);
        nameInput.style.display = 'none';
        
        // Resume game
        isPaused = false;
        if (!gameLoop) {
            gameLoop = setInterval(moveSnake, GAME_SPEED);
        }
        
        if (score > 0) {
            saveGlobalScore(playerName, score);
        }
    }
}

// Load high scores from localStorage
function loadHighScores() {
    const saved = localStorage.getItem('snakeHighScores');
    try {
        highScores = saved ? JSON.parse(saved) : [];
        // Convert old format scores to new format if needed
        if (highScores.length > 0 && typeof highScores[0] !== 'object') {
            highScores = highScores.map(score => ({
                name: playerName || 'Anonymous',
                score: score,
                date: new Date().toISOString()
            }));
            saveHighScores();
        }
    } catch (e) {
        console.error('Error loading high scores:', e);
        highScores = [];
    }
    updateHighScoresDisplay();
}

// Save high scores to localStorage
function saveHighScores() {
    try {
        localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
        updateHighScoresDisplay();
    } catch (e) {
        console.error('Error saving high scores:', e);
    }
}

// Load global scores from Firebase
function loadGlobalScores() {
    if (!scoresRef) {
        console.error('Firebase not initialized');
        globalScores = [];
        updateHighScoresDisplay();
        return;
    }

    try {
        // Show loading state
        const scoresList = document.getElementById('scoresList');
        scoresList.innerHTML = '<li class="loading">Loading global scores...</li>';
        
        // Use orderByChild to sort by score in descending order
        scoresRef.orderByChild('score')
            .limitToLast(MAX_HIGH_SCORES)
            .once('value')
            .then((snapshot) => {
                globalScores = [];
                // Convert to array and sort by score (descending)
                snapshot.forEach((childSnapshot) => {
                    globalScores.push(childSnapshot.val());
                });
                globalScores.sort((a, b) => b.score - a.score);
                console.log('Global scores loaded:', globalScores); // Debug log
                updateHighScoresDisplay();
            })
            .catch((error) => {
                console.error('Error loading global scores:', error);
                globalScores = [];
                updateHighScoresDisplay();
            });
    } catch (error) {
        console.error('Error in loadGlobalScores:', error);
        globalScores = [];
        updateHighScoresDisplay();
    }
}

// Save score to Firebase
function saveGlobalScore(name, score) {
    if (!scoresRef) {
        console.error('Firebase not initialized');
        return;
    }

    if (!name || !score) {
        console.error('Invalid score data:', { name, score });
        return;
    }
    
    const newScore = {
        name: name,
        score: score,
        timestamp: Date.now()
    };

    console.log('Saving score:', newScore); // Debug log

    // Save score immediately and reload leaderboard
    scoresRef.push(newScore)
        .then(() => {
            console.log('Score saved successfully');
            // Force reload global scores
            setTimeout(loadGlobalScores, 500); // Small delay to ensure database update
        })
        .catch(error => {
            console.error('Error saving score:', error);
        });
}

// Check if the score qualifies for global leaderboard
function checkGlobalHighScore(score) {
    if (globalScores.length < MAX_HIGH_SCORES) return true;
    return score > globalScores[globalScores.length - 1].score;
}

// Update the display of high scores
function updateHighScoresDisplay() {
    const scoresList = document.getElementById('scoresList');
    scoresList.innerHTML = '';
    
    const scores = currentView === 'local' ? highScores : globalScores;
    
    if (scores && scores.length > 0) {
        scores.forEach((score, index) => {
            const li = document.createElement('li');
            li.className = 'score-item';
            const date = new Date(score.timestamp || Date.now()).toLocaleDateString();
            li.innerHTML = `
                <span class="score-rank">#${index + 1}</span>
                <span class="score-name">${score.name}</span>
                <span class="score-value">${score.score}</span>
                <span class="score-date">${date}</span>
            `;
            scoresList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.className = 'score-item';
        li.innerHTML = `
            <span class="score-name">
                ${currentView === 'local' ? 'No personal scores yet!' : 'No global scores yet!'}
            </span>
        `;
        scoresList.appendChild(li);
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
        return date.toLocaleDateString();
    } else if (days > 0) {
        return `${days}d ago`;
    } else if (hours > 0) {
        return `${hours}h ago`;
    } else if (minutes > 0) {
        return `${minutes}m ago`;
    } else {
        return 'Just now';
    }
}

// Check if the current score is a high score
function checkHighScore(score) {
    const lowestScore = highScores.length < MAX_HIGH_SCORES ? 0 : Math.min(...highScores.map(s => s.score));
    if (score > lowestScore || highScores.length < MAX_HIGH_SCORES) {
        const newScore = {
            name: playerName || 'Anonymous',
            score: score,
            date: new Date().toISOString()
        };
        highScores.push(newScore);
        highScores.sort((a, b) => b.score - a.score);
        if (highScores.length > MAX_HIGH_SCORES) {
            highScores.pop();
        }
        saveHighScores();
        return true;
    }
    return false;
}

// Handle tab switching
localTab.addEventListener('click', () => {
    currentView = 'local';
    localTab.classList.add('active');
    globalTab.classList.remove('active');
    updateHighScoresDisplay();
});

globalTab.addEventListener('click', () => {
    currentView = 'global';
    globalTab.classList.add('active');
    localTab.classList.remove('active');
    updateHighScoresDisplay();
});

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
    if (isPaused) return;
    
    const head = {...snake[0]};

    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    // Check collision with walls or self
    if (head.x < 0 || head.x >= size || head.y < 0 || head.y >= size ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)) {
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

function showLastScore() {
    lastScoreValueElement.textContent = score;
    lastScoreElement.style.display = 'block';
    setTimeout(() => {
        lastScoreElement.style.opacity = '0';
        setTimeout(() => {
            lastScoreElement.style.display = 'none';
            lastScoreElement.style.opacity = '0.8';
        }, 2000);
    }, 3000);
}

function gameOver() {
    clearInterval(gameLoop);
    gameLoop = null;
    
    // Update last score display
    lastScoreElement.style.display = 'block';
    lastScoreElement.querySelector('#lastScoreValue').textContent = score;
    
    // Check if it's a high score
    const isHighScore = !highScores.length || score > highScores[0].score;
    if (isHighScore) {
        const scoreData = {
            score: score,
            name: playerName || 'Anonymous',
            date: new Date().toISOString()
        };
        highScores.unshift(scoreData);
        highScores.sort((a, b) => b.score - a.score);
        highScores = highScores.slice(0, MAX_HIGH_SCORES);
        saveHighScores();
    }
    
    // Always try to save to global leaderboard
    if (score > 0) {
        if (playerName) {
            saveGlobalScore(playerName, score);
        } else {
            askPlayerName();
        }
    }
    
    updateHighScoresDisplay();
    resetGame();
}

function resetGame() {
    snake = [{x: 7, y: 7}];
    direction = 'right';
    score = 0;
    scoreElement.textContent = score;
    generateFood();
    updateGame();
    gameLoop = setInterval(moveSnake, GAME_SPEED);
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
        // Don't handle game controls if name input is active
        if (nameInput.style.display === 'flex') {
            return;
        }

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
    loadGlobalScores();
    loadHighScores();
    initializeBoard();
    setupKeyboardControls();
    setupTouchControls();
    if (!playerName) {
        askPlayerName();
    }
    resetGame();
    globalTab.classList.add('active');
}

// Start the game when the page loads
window.addEventListener('load', init);
