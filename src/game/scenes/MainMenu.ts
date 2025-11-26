import { Scene } from 'phaser';

import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    circles: Phaser.GameObjects.Arc[] = [];

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        for (let i = 0; i < 8; i++)
        {
            this.circles.push(this.add.circle(512, 384, 10, 0xffffff));
        }

        EventBus.emit('current-scene-ready', this);
    }

    update (time: number, delta: number)
    {
        this.circles.forEach((circle, index) => {
            const angle = (time / 1000) + (index * (Math.PI * 2) / 8);
            circle.x = 512 + Math.cos(angle) * 200;
            circle.y = 384 + Math.sin(angle) * 200;
        });
    }

    changeScene ()
    {
        this.scene.start('Game');
    }
}
