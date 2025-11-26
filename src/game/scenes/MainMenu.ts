import { Scene } from 'phaser';

import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    circles: { circle: Phaser.GameObjects.Arc, filled: boolean, star?: Phaser.GameObjects.Image }[] = [];
    playerStar: Phaser.GameObjects.Image;
    isShooting: boolean = false;
    velocity: Phaser.Math.Vector2;
    winText: Phaser.GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        // Create 8 circles
        for (let i = 0; i < 8; i++)
        {
            const circle = this.add.circle(512, 384, 10, 0xffffff);
            this.circles.push({ circle, filled: false });
        }

        // Create Player Star
        this.spawnPlayerStar();

        // Input Listeners
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.isShooting && this.playerStar)
            {
                const angle = Phaser.Math.Angle.Between(this.playerStar.x, this.playerStar.y, pointer.x, pointer.y);
                this.playerStar.setRotation(angle + Math.PI / 2); // Adjust for sprite orientation if needed
            }
        });

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (!this.isShooting && this.playerStar)
            {
                this.isShooting = true;
                const angle = Phaser.Math.Angle.Between(this.playerStar.x, this.playerStar.y, pointer.x, pointer.y);
                this.velocity = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle)).scale(600); // Speed 600
            }
        });

        EventBus.emit('current-scene-ready', this);
    }

    update (time: number, delta: number)
    {
        // Move Circles
        this.circles.forEach((item, index) => {
            const angle = (time / 1000) + (index * (Math.PI * 2) / 8);
            item.circle.x = 512 + Math.cos(angle) * 200;
            item.circle.y = 384 + Math.sin(angle) * 200;

            // Move stuck stars with their circles
            if (item.star)
            {
                item.star.x = item.circle.x;
                item.star.y = item.circle.y;
            }
        });

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
                        if (distance < 20) // Circle radius 10 + Star radius approx 10
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
        this.isShooting = false;
        this.playerStar = this.add.image(512, 384, 'star');
        // Reset rotation to point up or towards mouse if we wanted, but 0 is fine
    }

    stickStar (item: { circle: Phaser.GameObjects.Arc, filled: boolean, star?: Phaser.GameObjects.Image })
    {
        item.filled = true;
        item.star = this.playerStar;
        this.playerStar = undefined as any; // Clear reference
        this.isShooting = false;

        if (this.checkWin())
        {
            this.winText = this.add.text(512, 384, 'YOU WIN!', {
                fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
                stroke: '#000000', strokeThickness: 8,
                align: 'center'
            }).setOrigin(0.5).setDepth(100);
        }
        else
        {
            this.spawnPlayerStar();
        }
    }

    checkWin (): boolean
    {
        return this.circles.every(item => item.filled);
    }

    changeScene ()
    {
        this.scene.start('Game');
    }
}
