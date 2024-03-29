const w : number = window.innerWidth
const h : number = window.innerHeight
const scGap : number = 0.05
const scDiv : number = 0.51
const strokeFactor : number = 90
const sizeFactor : number = 2.9
const nodes : number = 5
const foreColor : string = "#9C27B0"
const backColor : string = "#BDBDBD"

class ScaleUtil {

    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n
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
        context.strokeRect(-size / 2, -size, size, size + size * sc2)
        for (var i = 0; i < 2; i++) {
            context.save()
            context.translate(0, -r + 2 * r * sc2 * i)
            DrawingUtil.drawStrokedCircle(context, r, sc1)
            context.restore()
        }
    }

    static drawCBNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        const gap : number = w / (nodes + 1)
        const size : number = gap / sizeFactor
        const sc1 : number = ScaleUtil.divideScale(scale, 0, 2)
        const sc2 : number = ScaleUtil.divideScale(scale, 1, 2)
        context.strokeStyle = foreColor
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / strokeFactor
        context.save()
        context.translate(gap * (i + 1), h / 2)
        DrawingUtil.drawBoxCircle(context, size, sc1, sc2)
        context.restore()
    }
}

class CircleBoxStage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D
    renderer : Renderer = new Renderer()

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor
        this.context.fillRect(0, 0, w, h)
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
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
        console.log(this.scale)
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

class CBNode {

    next : CBNode
    prev : CBNode
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new CBNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawCBNode(context, this.i, this.state.scale)
        if (this.next) {
            this.next.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : CBNode {
        var curr : CBNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class CircleBox {

    root : CBNode = new CBNode(0)
    curr : CBNode = this.root
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {

    cb : CircleBox = new CircleBox()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.cb.draw(context)
    }

    handleTap(cb : Function) {
        this.cb.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.cb.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}
