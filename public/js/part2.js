var urlParams = new URLSearchParams(window.location.search);
var scoreDepart = parseInt(urlParams.get('score')) || 0;

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'jeu',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 300 }, debug: false }
    },
    scene: { preload: preload, create: create, update: update }
};

var platforms, player, cursors;
var score = scoreDepart;
var stars, bombs, door;
var gameOver = false;
var scoreText, timerText;
var vague = 0;

var socket, otherPlayers = {};

var liste_plateformes = [
    {x: 150, y: 200, t: 'ground', sx: 0.5, sy: 1},
    {x: 650, y: 200, t: 'ground', sx: 0.5, sy: 1},
    {x: 400, y: 350, t: 'ground', sx: 0.75, sy: 1},
    {x: 100, y: 450, t: 'ground', sx: 0.5, sy: 1},
    {x: 700, y: 450, t: 'ground', sx: 0.5, sy: 1}
];

var game = new Phaser.Game(config);

function preload() {
    this.load.image('sky',    'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star',   'assets/star.png');
    this.load.image('bomb',   'assets/bomb.png');
    this.load.image('door',   'assets/door.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
}

function create() {
    var scene = this;

    this.add.image(400, 300, 'sky');

    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2, 2).refreshBody();
    liste_plateformes.forEach(function(p) {
        platforms.create(p.x, p.y, p.t).setScale(p.sx, p.sy).refreshBody();
    });

    player = this.physics.add.sprite(400, 450, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10, repeat: -1
    });
    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10, repeat: -1
    });

    stars = this.physics.add.group({
        key: 'star',
        repeat: 10,
        setXY: { x: 50, y: 0, stepX: 70 }
    });
    stars.children.iterate(function(child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    bombs = this.physics.add.group();

    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);

    this.physics.add.overlap(player, stars, collectStar, null, this);
    this.physics.add.collider(player, bombs, hitBomb, null, this);

    scoreText = this.add.text(16, 16, 'Score: ' + score, { fontSize: '28px', fill: '#000' });
    scoreText.setScrollFactor(0);
    timerText = this.add.text(580, 16, 'Temps: 0s', { fontSize: '28px', fill: '#000' });
    timerText.setScrollFactor(0);

    cursors = this.input.keyboard.createCursorKeys();

    document.getElementById('score').textContent = 'Score : ' + score;

    // Socket.IO
    socket = io();
    socket.on('currentPlayers', function(players) {
        Object.keys(players).forEach(function(id) {
            if (id !== socket.id) addOtherPlayer(scene, players[id], id);
        });
    });
    socket.on('newPlayer', function(data) {
        addOtherPlayer(scene, data, data.id);
    });
    socket.on('playerMoved', function(data) {
        if (otherPlayers[data.id]) {
            otherPlayers[data.id].setPosition(data.x, data.y);
            otherPlayers[data.id].anims.play(data.anim, true);
        }
    });
    socket.on('playerDisconnected', function(id) {
        if (otherPlayers[id]) {
            otherPlayers[id].destroy();
            delete otherPlayers[id];
        }
    });
}

function update(time) {
    if (gameOver) { return; }

    timerText.setText('Temps: ' + Math.floor(time / 1000) + 's');

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }

    if (socket && player) {
        socket.emit('playerMove', {
            x: player.x,
            y: player.y,
            anim: player.anims.currentAnim ? player.anims.currentAnim.key : 'turn'
        });
    }
}

function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);
    document.getElementById('score').textContent = 'Score : ' + score;

    if (stars.countActive(true) === 0) {
        vague++;

        if (vague < 2) {
            stars.children.iterate(function(child) {
                child.enableBody(true, child.x, 0, true, true);
            });

            var x = (player.x < 400)
                ? Phaser.Math.Between(400, 750)
                : Phaser.Math.Between(50, 400);
            var bomb = bombs.create(x, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
            bomb.allowGravity = false;

        } else {
            door = this.physics.add.sprite(400, 100, 'door');
            door.setScale(0.3);
            door.setBounce(0);
            door.setCollideWorldBounds(true);
            this.physics.add.collider(door, platforms);
            this.physics.add.overlap(player, door, endGame, null, this);
        }
    }
}

function hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;
}

function endGame(player, door) {
    if (gameOver) { return; }
    gameOver = true;

    this.add.text(170, 250, 'Terminé ! Score : ' + score, { fontSize: '48px', fill: '#ff0' });
    door.disableBody(true, true);
    player.setVelocityX(0);
    player.anims.play('turn');
}

function addOtherPlayer(scene, data, id) {
    var otherPlayer = scene.physics.add.sprite(data.x, data.y, 'dude');
    otherPlayer.setTint(0xff0000);
    otherPlayer.setBounce(0.2);
    otherPlayer.setCollideWorldBounds(true);
    scene.physics.add.collider(otherPlayer, platforms);
    otherPlayers[id] = otherPlayer;
}
