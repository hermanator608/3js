import EventEmitter from "./eventEmit"

export class Sizes extends EventEmitter
{
    constructor()
    {
        super()
        
        // Setup
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.pixelRatio = Math.min(window.devicePixelRatio, 2)

        window.addEventListener('resize', () =>
        {
            // ...

            this.trigger('resize')
        })
    }
}