module Lottery {

    class Tool {
        static _vendors:string[] = ['webkit', 'ms', 'moz', 'o'];

        static extends(opt, ...more) {
            opt = opt || {};
            for (let i = 1; i < arguments.length; i++) {
                if (!!arguments[i]) {
                    for (var key in arguments[i]) {
                        if (arguments[i].hasOwnProperty(key)) {
                            opt[key] = arguments[i][key];
                        }
                    }
                }
            }
            return opt;
        }

        static camelCase(str:string):string {
            return str.replace(/-([a-z])/ig, function (all, letter) {
                return letter.toUpperCase();
            });
        }

        static css(element, property:string, value:string):string {
            if (element.style[property] === undefined) {
                for (let i = 0; i < this._vendors.length; i++) {
                    property = this.camelCase(this._vendors[i] + '-' + property);
                    if (element.style[property] !== undefined) {
                        break;
                    }
                }
            }
            element.style[property] = value;
            return property;
        }

        constructor() {
        }
    }

    class Events {
        private _queue = {};

        on(key:string, callback) {
            this._queue[key] = this._queue[key] || [];
            this._queue[key].push(callback);
            return this;
        }

        off(key:string, callback?) {
            if (!this._queue[key]) return this;
            let index = typeof (callback) == "undefined" ? -2 : this._queue[key].indexOf(callback);
            if (index == -2) {
                delete this._queue[key];
            } else if (index != -1) {
                this._queue[key].splice(index, 1);
            }
            if (this._queue[key] && this._queue[key].length == 0) delete this._queue[key];
            return this;
        }

        has(key) {
            return !!this._queue[key];
        }

        trigger(key, ...value) {
            if (!this._queue[key]) return this;
            for (let i = 0; i < this._queue[key].length; i++) {
                this._queue[key][i].apply(null, value);
            }
            return this;
        }
    }

    class TigerRoller {
        private elem;
        private items:any[];
        private height:number;
        private callback;
        private variable:boolean;
        private index:number = 0;
        private state:number = 0;

        constructor(elem, variable) {
            this.elem = elem;
            this.items = elem.children;
            this.height = this.items[0].clientHeight;

            //克隆第一个节点 用于制作无限滚动效果
            this.elem.appendChild(this.items[0].cloneNode(true));

            //如果大小是可变的就绑定resize事件
            if (variable) window.addEventListener('onorientationchange' in document ? 'orientationchange' : 'resize', this._onResize.bind(this));
        }

        public reset() {
            this.elem.classList.remove('fx-roll');
            this.elem.style.marginTop = 0;
            this.callback = null;
            this.index = 0;
            this.state = 0;
        }

        public start(timeout:number = 0) {
            this.state = 1;
            setTimeout(() => {
                if (this.state != 1) return;
                this.elem.style.marginTop = 0;
                this.elem.classList.add('fx-roll');
            }, timeout);
        }

        public stop(index:number, callback, timeout:number = 0) {
            this.callback = callback;
            this.index = index;
            setTimeout(()=> {
                if (this.state != 1) return;
                this.elem.style.marginTop = -index * this.height + 'px';
                this.elem.classList.remove('fx-roll');
                this.elem.classList.add('fx-bounce');
                window['animationEnd'](this.elem, ()=> {
                    this.state = 0;
                    this.elem.classList.remove('fx-bounce');
                    if (this.callback) this.callback.call(this);
                }, true);
            }, timeout);
        }

        private _onResize() {
            this.height = this.items[0].clientHeight;
            if (!this.elem.classList.contains('fx-roll')) this.elem.style.marginTop = -this.index * this.height + 'px';
        }
    }

    interface Lottery extends Events {
        setResult(ret:any):void;
        reset():void;
        draw():void;
    }

    export class Dial extends Events implements Lottery {
        private pointer;
        private _raf;
        private config = {
            speed: 30, //每帧速度
            areaNumber: 8 //奖区数量
        };
        private _transform:string = 'transform';
        private _runAngle:number = 0;
        private _targetAngle:number = -1;

        constructor(pointer, config?) {
            super();
            this.pointer = pointer;
            this.config = Tool.extends({}, this.config, config);

            //初始化样式设定
            this._transform = Tool.css(this.pointer, this._transform, 'translate3d(0,0,0)');
            Tool.css(this.pointer, 'backfaceVisibility', 'hidden');
            Tool.css(this.pointer, 'perspective', '1000px');

            //事件注入 (当设置结果时)
            this.on('__setResult', (index)=> {
                //得到中奖结果 index:中奖奖区下标
                var singleAngle = 360 / this.config.areaNumber, //单个奖区角度值
                    endAngle = Math.ceil((Math.random() * singleAngle) + (index * singleAngle)); //随机得出结果角度

                this._runAngle = 0;
                this._targetAngle = endAngle + (Math.floor(Math.random() * 4) + 4) * 360; //随机旋转几圈再停止
            });
        }

        public setResult(index:number):void {
            this.trigger('__setResult', index);
        }

        public reset(event:string = 'reset'):void {
            if (!this._raf) return;
            window.cancelAnimationFrame(this._raf);
            this._raf = null;
            this._runAngle = 0;
            this._targetAngle = -1;
            this.trigger(event);
            if (event == 'reset') Tool.css(this.pointer, this._transform, 'translate3d(0,0,0) rotate(0deg)');
        }

        public draw():void {
            if (this._raf) return;
            var _draw = function () {
                var angle = 0;

                var step = function () {
                    //如果没有设置结束点 就匀速不停旋转
                    //如果设置了结束点 就减速到达结束点
                    if (this._targetAngle == -1) {
                        this._runAngle += this.config.speed;
                    } else {
                        angle = (this._targetAngle - this._runAngle) / this.config.speed;
                        angle = angle > this.config.speed ? this.config.speed : angle < 0.5 ? 0.5 : angle;
                        this._runAngle += angle;
                        this._runAngle = this._runAngle > this._targetAngle ? this._targetAngle : this._runAngle;
                    }
                    //指针旋转
                    Tool.css(this.pointer, this._transform, 'translate3d(0,0,0) rotate(' + (this._runAngle % 360) + 'deg)');

                    if (this._runAngle == this._targetAngle) {
                        this.reset('end');
                    } else {
                        this._raf = window.requestAnimationFrame(step.bind(this));
                    }
                };

                this._raf = window.requestAnimationFrame(step.bind(this))
            };
            this.has('start') ? this.trigger('start', _draw.bind(this)) : _draw.call(this);
        }
    }

    export class Scratch extends Events implements Lottery {
        private canvas;
        private ctx;
        private width:number;
        private height:number;
        private offsetX:number;
        private offsetY:number;
        private config = {
            size: 20, //滑动区域大小
            percent: 50, //激活百分比到谋个值 就全显示
            variable: true //canvas的大小是否是可变的
        };
        private _state:string = 'load';
        private _touch:boolean = false;
        private _request:boolean = false;

        constructor(canvas, config) {
            super();
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.config = Tool.extends({}, this.config, config);

            //初始化
            this._state = 'init';
            this._init();

            //绑定事件
            this.canvas.addEventListener('ontouchstart' in document ? 'touchstart' : 'mousedown', this._onTouchStart.bind(this), false);
            this.canvas.addEventListener('ontouchmove' in document ? 'touchmove' : 'mousemove', this._onTouchMove.bind(this), false);
            document.addEventListener('ontouchend' in document ? 'touchend' : 'mouseup', this._onTouchEnd.bind(this));
            window.addEventListener('onorientationchange' in document ? 'orientationchange' : 'resize', this._onResize.bind(this));
        }

        public setResult(url):void {
            this.canvas.style.backgroundImage = 'url(' + url + ')';
        }

        public draw():void {
            if (this._state == 'end') return;
            this.ctx.clearRect(0, 0, this.width, this.height);
            this._state = 'end';
            this.trigger('end');
        }

        public reset():void {
            this._state = 'init';
            this._request = false;
            this._touch = false;
            this.canvas.style.backgroundImage = null;
            this._init();
            this.trigger('reset');
        }

        private _init():void {
            this._setCanvasSize();
            this._getCanvasOffset();

            this.ctx.closePath();
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = 'gray';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.globalCompositeOperation = 'destination-out';
        }

        private _scratchPercent():number {
            var hits = 0,
                imageData = this.ctx.getImageData(0, 0, this.width, this.height);

            for (let i = 0, ii = imageData.data.length; i < ii; i = i + 4) {
                if (imageData.data[i] === 0 && imageData.data[i + 1] === 0 && imageData.data[i + 2] === 0 && imageData.data[i + 3] === 0) {
                    hits++;
                }
            }

            return (hits / (this.width * this.height)) * 100;
        }

        private _setCanvasSize():void {
            this.width = this.canvas.clientWidth;
            this.height = this.canvas.clientHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }

        private _getCanvasOffset():void {
            var box = this.canvas.getBoundingClientRect();

            var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
            var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;

            var clientTop = document.documentElement.clientTop || document.body.clientTop || 0;
            var clientLeft = document.documentElement.clientLeft || document.body.clientLeft || 0;

            this.offsetX = Math.round(box.left + scrollLeft - clientLeft);
            this.offsetY = Math.round(box.top + scrollTop - clientTop);
        }

        private _getEventXY(e) {
            e = e.changedTouches ? e.changedTouches[0] : e;
            return {
                x: e.pageX - this.offsetX,
                y: e.pageY - this.offsetY
            }
        }

        private _onTouchStart(e):void {
            e.preventDefault();
            if (this._state == 'end') return;
            var _draw = function (e) {
                var point = this._getEventXY(e);
                this._state = 'start';
                this._touch = true;
                this._request = true;

                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, this.config.size / 2, 0, Math.PI * 2, true);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.beginPath();
                this.ctx.lineWidth = this.config.size;
                this.ctx.moveTo(point.x, point.y);
            };

            this.has('start') && !this._request ? this.trigger('start', _draw.bind(this, e)) : _draw.call(this, e);
        }

        private _onTouchMove(e):void {
            e.preventDefault();
            if (!this._touch) return;
            var point = this._getEventXY(e);
            this.ctx.lineTo(point.x, point.y);
            this.ctx.stroke();
        }

        private _onTouchEnd(e) {
            if (!this._touch) return;
            var point = this._getEventXY(e);
            this._touch = false;

            this.ctx.closePath();
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, this.config.size / 2, 0, Math.PI * 2, true);
            this.ctx.closePath();
            this.ctx.fill();

            if (this._scratchPercent() >= this.config.percent) {
                this.ctx.clearRect(0, 0, this.width, this.height);
                this._state = 'end';
                this.trigger('end');
            }
        }

        private _onResize():void {
            this._touch = false;
            if (this.config.variable) {
                if (this._state == 'end') {
                    this._setCanvasSize();
                } else {
                    this._init()
                }
            } else {
                this._getCanvasOffset();
            }
        }
    }

    export class Tiger extends Events implements Lottery {
        private toggle;
        private config = {
            timeout: 300, //每个roller间动画间隔
            timeDiff: 6000, //动画执行最少时间
            variable: true //roller大小是否是可变的
        };
        private rollerQueue:any[] = [];
        private _startTime:number;

        constructor(toggle, roller, config) {
            super();
            this.toggle = toggle;
            this.config = Tool.extends({}, this.config, config);

            //初始化滚轴
            for (let i = 0; i < roller.length; i++) {
                this.rollerQueue.push(new TigerRoller(roller[i], this.config.variable));
            }
        }

        setResult(ret):void {
            //保证动画执行时间
            var endTime = (new Date()).getTime();
            setTimeout(() => {
                for (let i = 0, l = this.rollerQueue.length; i < l; i++) {
                    this.rollerQueue[i].stop(ret[i], (i == l - 1 ? () => {
                        this.toggle.classList.remove('z-active');
                        this.trigger('end');
                    } : null), i * this.config.timeout);
                }
            }, endTime - this._startTime > this.config.timeDiff ? 0 : this.config.timeDiff - (endTime - this._startTime));
        }

        reset():void {
            this.toggle.classList.remove('z-active');
            for (let i = 0, l = this.rollerQueue.length; i < l; i++) {
                this.rollerQueue[i].reset();
            }
            this.trigger('reset');
        }

        draw():void {
            if (this.toggle.classList.contains('z-active')) return;
            var _draw = function () {
                this.toggle.classList.add('z-active');
                for (let i = 0, l = this.rollerQueue.length; i < l; i++) {
                    this.rollerQueue[i].start(i * this.config.timeout);
                }
            };
            this._startTime = (new Date()).getTime();
            this.has('start') ? this.trigger('start', _draw.bind(this)) : _draw.call(this);
        }
    }
}