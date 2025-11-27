import { Scene } from 'phaser';

import { EventBus } from '../EventBus';

const ROTATION_SPEED = 1500; // lower number = faster rotation

export class MainMenu extends Scene
{
    circles: { circle: Phaser.GameObjects.Arc, filled: boolean, star?: Phaser.GameObjects.Image }[] = [];
    playerStar: Phaser.GameObjects.Image;
    isShooting: boolean = false;
    velocity: Phaser.Math.Vector2;
    
    score: number = 0;
    scoreText: Phaser.GameObjects.Text;
    timeLeft: number = 30;
    timerText: Phaser.GameObjects.Text;
    gameActive: boolean = true;
    gameOverText: Phaser.GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        // Reset state
        this.score = 0;
        this.timeLeft = 30;
        this.gameActive = true;
        this.circles = [];

        // Create 8 circles
        for (let i = 0; i < 8; i++)
        {
            const circle = this.add.circle(512, 384, 10, 0xffffff);
            this.circles.push({ circle, filled: false });
        }

        // Create Player Star
        this.spawnPlayerStar();

        // UI
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', color: '#ffffff' });
        this.timerText = this.add.text(1024 - 16, 16, 'Time: 30', { fontSize: '32px', color: '#ffffff' }).setOrigin(1, 0);

        // Timer Event
        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        // Input Listeners
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.gameActive && !this.isShooting && this.playerStar)
            {
                const angle = Phaser.Math.Angle.Between(this.playerStar.x, this.playerStar.y, pointer.x, pointer.y);
                this.playerStar.setRotation(angle + Math.PI / 2);
            }
        });

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.gameActive && !this.isShooting && this.playerStar)
            {
                this.isShooting = true;
                const angle = Phaser.Math.Angle.Between(this.playerStar.x, this.playerStar.y, pointer.x, pointer.y);
                this.velocity = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle)).scale(600);
            }
        });

        EventBus.emit('current-scene-ready', this);
    }

    updateTimer ()
    {
        if (!this.gameActive) return;

        this.timeLeft--;
        this.timerText.setText(`Time: ${this.timeLeft}`);

        if (this.timeLeft <= 0)
        {
            this.gameActive = false;
            this.gameOverText = this.add.text(512, 384, `GAME OVER\nScore: ${this.score}`, {
                fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
                stroke: '#000000', strokeThickness: 8,
                align: 'center'
            }).setOrigin(0.5).setDepth(100);
            
            if (this.playerStar) this.playerStar.destroy();
        }
    }

    update (time: number, delta: number)
    {
        // Move Circles
        this.circles.forEach((item, index) => {
            const angle = (time / ROTATION_SPEED) + (index * (Math.PI * 2) / 8);
            item.circle.x = 512 + Math.cos(angle) * 200;
            item.circle.y = 384 + Math.sin(angle) * 200;

            // Move stuck stars with their circles
            if (item.star)
            {
                item.star.x = item.circle.x;
                item.star.y = item.circle.y;
            }
        });

        if (!this.gameActive) return;

        // Handle Shooting
        if (this.isShooting && this.playerStar)
        {
            this.playerStar.x += this.velocity.x * (delta / 1000);
            this.playerStar.y += this.velocity.y * (delta / 1000);

            // Check Bounds
            if (this.playerStar.x < 0 || this.playerStar.x > 1024 || this.playerStar.y < 0 || this.playerStar.y > 768)
            {
                this.playerStar.destroy();
                this.spawnPlayerStar();
            }
            else
            {
                // Check Collision
                for (const item of this.circles)
                {
                    if (!item.filled)
                    {
                        const distance = Phaser.Math.Distance.Between(this.playerStar.x, this.playerStar.y, item.circle.x, item.circle.y);
                        if (distance < 20)
                        {
                            this.stickStar(item);
                            break;
                        }
                    }
                }
            }
        }
    }

    spawnPlayerStar ()
    {
        if (!this.gameActive) return;
        this.isShooting = false;
        this.playerStar = this.add.image(512, 384, 'star');
    }

    stickStar (item: { circle: Phaser.GameObjects.Arc, filled: boolean, star?: Phaser.GameObjects.Image })
    {
        item.filled = true;
        item.star = this.playerStar;
        this.playerStar = undefined as any;
        this.isShooting = false;

        this.score++;
        this.scoreText.setText(`Score: ${this.score}`);

        if (this.circles.every(c => c.filled))
        {
            this.circles.forEach(c => {
                if (c.star) {
                    c.star.destroy();
                    c.star = undefined;
                }
                c.filled = false;
            });
        }

        this.spawnPlayerStar();
    }

    changeScene ()
    {
        this.scene.start('Game');
    }
}
