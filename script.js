// Game state
let slots = [0, 1, 2];
const ballCupId = 1;
let canPick = false;
let shuffling = false;

// Game settings
let gameSettings = {
    language: 'en',
    players: 1,
    difficulty: 'medium',
    currentPlayer: 1,
    scores: []
};

// Translations
const translations = {
    en: {
        selectLanguage: 'SELECT LANGUAGE',
        selectPlayers: 'SELECT NUMBER OF PLAYERS',
        selectDifficulty: 'SELECT DIFFICULTY',
        solo: 'SOLO',
        players: 'PLAYERS',
        easy: 'EASY',
        medium: 'MEDIUM',
        hard: 'HARD',
        extreme: 'EXTREME',
        adaptive: 'ADAPTIVE MODE',
        player: 'Player',
        watchClosely: 'WATCH CLOSELY',
        pickCup: 'PICK A CUP',
        youWin: 'YOU WIN!',
        wrongCup: 'WRONG CUP!',
        startRound: 'START ROUND',
        playAgain: 'PLAY AGAIN',
        backToMenu: 'BACK TO MENU'
    },
    zh: {
        selectLanguage: '選擇語言',
        selectPlayers: '選擇玩家人數',
        selectDifficulty: '選擇難度',
        solo: '單人',
        players: '玩家',
        easy: '簡單',
        medium: '普通',
        hard: '困難',
        extreme: '極限',
        adaptive: '適應模式',
        player: '玩家',
        watchClosely: '仔細觀察',
        pickCup: '選擇一個杯子',
        youWin: '你贏了！',
        wrongCup: '錯誤的杯子！',
        startRound: '開始回合',
        playAgain: '再玩一次',
        backToMenu: '返回菜單'
    }
};

const positions = [0, 155, 310];
const gameArea = document.getElementById("game-area");
const startBtn = document.getElementById("startBtn");
const status = document.getElementById("status");
const currentPlayerDisplay = document.getElementById("current-player");
const gameSettingsDisplay = document.getElementById("game-settings");

// Menu navigation
const welcomeScreen = document.getElementById("welcome-screen");
const languageScreen = document.getElementById("language-screen");
const playerScreen = document.getElementById("player-screen");
const difficultyScreen = document.getElementById("difficulty-screen");
const gameScreen = document.getElementById("game-screen");

// Welcome screen
document.getElementById("playBtn").onclick = () => {
    welcomeScreen.classList.add("hidden");
    languageScreen.classList.remove("hidden");
};

// Language selection
document.querySelectorAll("#language-screen button").forEach(btn => {
    btn.onclick = () => {
        gameSettings.language = btn.getAttribute("data-lang");
        updateLanguage();
        languageScreen.classList.add("hidden");
        playerScreen.classList.remove("hidden");
    };
});

// Player selection
document.querySelectorAll("#player-screen button").forEach(btn => {
    btn.onclick = () => {
        gameSettings.players = parseInt(btn.getAttribute("data-players"));
        gameSettings.scores = new Array(gameSettings.players).fill(0);
        playerScreen.classList.add("hidden");
        difficultyScreen.classList.remove("hidden");
    };
});

// Difficulty selection
document.querySelectorAll("#difficulty-screen button").forEach(btn => {
    btn.onclick = () => {
        // Remove selected class from all buttons
        document.querySelectorAll("#difficulty-screen button").forEach(b => {
            b.classList.remove("selected");
        });
        
        // Add selected class to clicked button
        btn.classList.add("selected");
        
        gameSettings.difficulty = btn.getAttribute("data-difficulty");
        
        // Small delay to show selection before transitioning
        setTimeout(() => {
            difficultyScreen.classList.add("hidden");
            gameScreen.classList.remove("hidden");
            updateGameInfo();
            initGame();
            
            // Show start button prominently
            const t = translations[gameSettings.language];
            startBtn.textContent = t.startRound;
            startBtn.style.display = "inline-block";
            status.textContent = "";
        }, 300);
    };
});

// Back to menu (removed - using home button in control panel instead)

// Control panel buttons
let isPaused = false;
let pauseResolve = null;

// Pause button
document.getElementById("pauseBtn").onclick = () => {
    const pauseBtn = document.getElementById("pauseBtn");
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseBtn.textContent = "▶";
        pauseBtn.classList.add("paused");
        pauseBtn.title = "Resume";
        if (shuffling) {
            status.textContent = "PAUSED";
        }
    } else {
        pauseBtn.textContent = "⏸";
        pauseBtn.classList.remove("paused");
        pauseBtn.title = "Pause";
        if (shuffling) {
            const t = translations[gameSettings.language];
            status.textContent = t.watchClosely;
        }
        if (pauseResolve) {
            pauseResolve();
            pauseResolve = null;
        }
    }
};

// Replay button
document.getElementById("replayBtn").onclick = () => {
    if (!shuffling) {
        initGame();
        shuffle();
    }
};

// Home button
document.getElementById("homeBtn").onclick = () => {
    // Reset pause state
    isPaused = false;
    const pauseBtn = document.getElementById("pauseBtn");
    pauseBtn.textContent = "⏸";
    pauseBtn.classList.remove("paused");
    
    // Go back to welcome screen
    gameScreen.classList.add("hidden");
    welcomeScreen.classList.remove("hidden");
    gameSettings.currentPlayer = 1;
    gameSettings.scores = [];
};

function updateLanguage() {
    const t = translations[gameSettings.language];
    document.querySelector("#player-screen .menu-title").textContent = t.selectPlayers;
    document.querySelector("#difficulty-screen .menu-title").textContent = t.selectDifficulty;
    
    // Update player buttons
    const playerBtns = document.querySelectorAll("#player-screen button");
    playerBtns[0].textContent = t.solo;
    playerBtns[1].textContent = `2 ${t.players}`;
    playerBtns[2].textContent = `3 ${t.players}`;
    playerBtns[3].textContent = `4 ${t.players}`;
    
    // Update difficulty buttons
    const diffBtns = document.querySelectorAll("#difficulty-screen button");
    diffBtns[0].textContent = t.easy;
    diffBtns[1].textContent = t.medium;
    diffBtns[2].textContent = t.hard;
    diffBtns[3].textContent = t.extreme;
    diffBtns[4].textContent = t.adaptive;
    
    // Update game buttons
    document.getElementById("startBtn").textContent = t.startRound;
}

function updateGameInfo() {
    const t = translations[gameSettings.language];
    currentPlayerDisplay.textContent = `${t.player} ${gameSettings.currentPlayer}`;
    const difficultyText = getDifficultyText();
    const speedInfo = getSpeedInfo();
    gameSettingsDisplay.textContent = `${gameSettings.players} ${t.players} | ${difficultyText} ${speedInfo}`;
}

function getSpeedInfo() {
    const shuffles = getShuffleCount();
    const speed = gameSettings.difficulty === 'extreme' ? 'Fastest' : 
                  gameSettings.difficulty === 'hard' ? 'Fast' :
                  gameSettings.difficulty === 'medium' ? 'Normal' : 'Slow';
    return `(${shuffles} swaps, ${speed})`;
}

function getDifficultyText() {
    const t = translations[gameSettings.language];
    const diffMap = {
        easy: t.easy,
        medium: t.medium,
        hard: t.hard,
        extreme: t.extreme,
        adaptive: t.adaptive
    };
    return diffMap[gameSettings.difficulty];
}

function getShuffleCount() {
    const countMap = {
        easy: 4,
        medium: 6,
        hard: 8,
        extreme: 12,
        adaptive: 6 // Will adjust based on performance
    };
    return countMap[gameSettings.difficulty];
}

function initGame() {
    gameArea.innerHTML = "";
    slots = [0, 1, 2];
    canPick = false;
    status.textContent = "";

    slots.forEach((id, i) => {
        const cup = document.createElement("div");
        cup.className = "cup";
        cup.style.left = positions[i] + "px";
        cup.style.bottom = "0px";
        cup.id = "cup-" + id;

        if (id === ballCupId) {
            const ball = document.createElement("div");
            ball.className = "ball";
            cup.appendChild(ball);
        }

        cup.onclick = () => pickCup(id);
        gameArea.appendChild(cup);
    });
}

async function shuffle() {
    if (shuffling) return;
    shuffling = true;
    startBtn.style.display = "none";
    startBtn.disabled = true;
    const t = translations[gameSettings.language];
    status.textContent = t.watchClosely;

    const shuffleCount = getShuffleCount();
    let shuffleSpeed;
    
    // Set speed based on difficulty
    switch(gameSettings.difficulty) {
        case 'easy':
            shuffleSpeed = 600;
            break;
        case 'medium':
            shuffleSpeed = 450;
            break;
        case 'hard':
            shuffleSpeed = 300;
            break;
        case 'extreme':
            shuffleSpeed = 200;
            break;
        case 'adaptive':
            shuffleSpeed = 400;
            break;
        default:
            shuffleSpeed = 450;
    }

    for (let i = 0; i < shuffleCount; i++) {
        let a = Math.floor(Math.random() * 3);
        let b = Math.floor(Math.random() * 3);
        while (a === b) b = Math.floor(Math.random() * 3);

        [slots[a], slots[b]] = [slots[b], slots[a]];

        slots.forEach((id, index) => {
            document.getElementById("cup-" + id).style.left =
                positions[index] + "px";
        });

        await new Promise(r => setTimeout(r, shuffleSpeed));
        
        // Check for pause
        while (isPaused) {
            await new Promise(resolve => {
                pauseResolve = resolve;
            });
        }
    }

    status.textContent = t.pickCup;
    canPick = true;
    shuffling = false;
    startBtn.disabled = false;
}

function pickCup(id) {
    if (!canPick) return;
    canPick = false;
    const t = translations[gameSettings.language];

    document.querySelectorAll(".cup").forEach(cup => {
        cup.classList.add("lift");
        const ball = cup.querySelector(".ball");
        if (ball) ball.style.display = "block";
    });

    const won = id === ballCupId;
    status.textContent = won ? t.youWin : t.wrongCup;

    if (won) {
        gameSettings.scores[gameSettings.currentPlayer - 1]++;
    }

    setTimeout(() => {
        // Move to next player or restart
        if (gameSettings.players > 1) {
            gameSettings.currentPlayer++;
            if (gameSettings.currentPlayer > gameSettings.players) {
                gameSettings.currentPlayer = 1;
            }
            updateGameInfo();
        }
        
        startBtn.textContent = t.playAgain;
        startBtn.style.display = "inline-block";
    }, 1500);
}

startBtn.onclick = () => {
    initGame();
    shuffle();
};

// Initialize
initGame();
