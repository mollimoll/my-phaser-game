import { Scene } from 'phaser';

import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    star: Phaser.GameObjects.Image;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.star = this.add.image(512, 384, 'star');

        EventBus.emit('current-scene-ready', this);
    }

    update (time: number, delta: number)
    {
        this.star.x = 512 + Math.cos(time / 1000) * 200;
        this.star.y = 384 + Math.sin(time / 1000) * 200;
    }

    changeScene ()
    {
        this.scene.start('Game');
    }
}
