const w : number = window.innerWidth
const h : number = window.innerHeight
const scGap : number = 0.05
const scDiv : number = 0.51
const strokeFactor : number = 90
const sizeFactor : number = 2.9
const nodes : number = 5
const foreColor : string = "#"
const backColor : string = "#BDBDBD"

class ScaleUtil {

    static maxScale(scale : number, i : number, b : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, maxScale(scale, i, n)) * n
    }

    static scaleFactor(scale : number) : number {
        return Math.floor(scale / scDiv)
    }

    static mirrorValue(scale : number, a : number, b : number) : number {
        const k : number = ScaleUtil.scaleFactor(scale)
        return (1 - k) / a + k / b
    }

    static updateValue(scale : number, dir : number, a : number, b : number) : number {
        return ScaleUtil.mirrorValue(scale, a, b) * dir * scGap
    }
}

class DrawingUtil {
    static drawStrokedCircle(context : CanvasRenderingContext2D, r : number, sc : number) {
        context.beginPath()
        for (var i = -90; i <= -90 + 360 * sc; i++) {
            const x : number = r * Math.cos(i * Math.PI / 180)
            const y : number = r * Math.sin(i * Math.PI / 180)
            if (i == -90) {
                context.moveTo(x, y)
            } else {
                context.lineTo(x, y)
            }
        }
        context.stroke()
    }

    static drawBoxCircle(context : CanvasRenderingContext2D, size : number, sc1 : number, sc2 : number) {
        const r : number = size / 2
        context.strokeRect(-size, -size / 2, size, size + size * sc2)
        for (var i = 0; i < 2; i++) {
            context.save()
            context.translate(0, -r + 2 * r * sc2 * i)
            DrawingUtil.drawStrokedCircle(context, r, sc1)
            contest.restore()
        }
    }

    static drawCBNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        const gap : number = w / (gaps + 1)
        const size : number = gap / sizeFactor
        const sc1 : number = ScaleUtil.divideScale(scale, 0, 2)
        const sc2 : number = ScaleUtil.divideScale(scale, 1, 2)
        context.save()
        context.translate(gap * (i + 1), h / 2)
        DrawingUtil.drawBoxCircle(context, size, sc1, sc2)
        context.restore()
    }
}

class CircleBoxStage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor
        this.context.fillRect(0, 0, w, h)
    }

    handleTap() {
        this.canvas.onmousedown = () => {

        }
    }

    static init() {
        const stage : CircleBoxStage = new CircleBoxStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {
    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += ScaleUtil.updateValue(this.scale, this.dir, 1, 1)
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {

    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}
