var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Lottery;
(function (Lottery) {
    var Tool = (function () {
        function Tool() {
        }
        Tool.extends = function (opt) {
            var more = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                more[_i - 1] = arguments[_i];
            }
            opt = opt || {};
            for (var i = 1; i < arguments.length; i++) {
                if (!!arguments[i]) {
                    for (var key in arguments[i]) {
                        if (arguments[i].hasOwnProperty(key)) {
                            opt[key] = arguments[i][key];
                        }
                    }
                }
            }
            return opt;
        };
        Tool.camelCase = function (str) {
            return str.replace(/-([a-z])/ig, function (all, letter) {
                return letter.toUpperCase();
            });
        };
        Tool.css = function (element, property, value) {
            if (element.style[property] === undefined) {
                for (var i = 0; i < this._vendors.length; i++) {
                    property = this.camelCase(this._vendors[i] + '-' + property);
                    if (element.style[property] !== undefined) {
                        break;
                    }
                }
            }
            element.style[property] = value;
            return property;
        };
        Tool._vendors = ['webkit', 'ms', 'moz', 'o'];
        return Tool;
    })();
    var Events = (function () {
        function Events() {
            this._queue = {};
        }
        Events.prototype.on = function (key, callback) {
            this._queue[key] = this._queue[key] || [];
            this._queue[key].push(callback);
            return this;
        };
        Events.prototype.off = function (key, callback) {
            if (!this._queue[key])
                return this;
            var index = typeof (callback) == "undefined" ? -2 : this._queue[key].indexOf(callback);
            if (index == -2) {
                delete this._queue[key];
            }
            else if (index != -1) {
                this._queue[key].splice(index, 1);
            }
            if (this._queue[key] && this._queue[key].length == 0)
                delete this._queue[key];
            return this;
        };
        Events.prototype.has = function (key) {
            return !!this._queue[key];
        };
        Events.prototype.trigger = function (key) {
            var value = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                value[_i - 1] = arguments[_i];
            }
            if (!this._queue[key])
                return this;
            for (var i = 0; i < this._queue[key].length; i++) {
                this._queue[key][i].apply(null, value);
            }
            return this;
        };
        return Events;
    })();
    var TigerRoller = (function () {
        function TigerRoller(elem, variable) {
            this.index = 0;
            this.state = 0;
            this.elem = elem;
            this.items = elem.children;
            this.height = this.items[0].clientHeight;
            //克隆第一个节点 用于制作无限滚动效果
            this.elem.appendChild(this.items[0].cloneNode(true));
            //如果大小是可变的就绑定resize事件
            if (variable)
                window.addEventListener('onorientationchange' in document ? 'orientationchange' : 'resize', this._onResize.bind(this));
        }
        TigerRoller.prototype.reset = function () {
            this.elem.classList.remove('fx-roll');
            this.elem.style.marginTop = 0;
            this.callback = null;
            this.index = 0;
            this.state = 0;
        };
        TigerRoller.prototype.start = function (timeout) {
            var _this = this;
            if (timeout === void 0) { timeout = 0; }
            this.state = 1;
            setTimeout(function () {
                if (_this.state != 1)
                    return;
                _this.elem.style.marginTop = 0;
                _this.elem.classList.add('fx-roll');
            }, timeout);
        };
        TigerRoller.prototype.stop = function (index, callback, timeout) {
            var _this = this;
            if (timeout === void 0) { timeout = 0; }
            this.callback = callback;
            this.index = index;
            setTimeout(function () {
                if (_this.state != 1)
                    return;
                _this.elem.style.marginTop = -index * _this.height + 'px';
                _this.elem.classList.remove('fx-roll');
                _this.elem.classList.add('fx-bounce');
                window['animationEnd'](_this.elem, function () {
                    _this.state = 0;
                    _this.elem.classList.remove('fx-bounce');
                    if (_this.callback)
                        _this.callback.call(_this);
                }, true);
            }, timeout);
        };
        TigerRoller.prototype._onResize = function () {
            this.height = this.items[0].clientHeight;
            if (!this.elem.classList.contains('fx-roll'))
                this.elem.style.marginTop = -this.index * this.height + 'px';
        };
        return TigerRoller;
    })();
    var Dial = (function (_super) {
        __extends(Dial, _super);
        function Dial(pointer, config) {
            var _this = this;
            _super.call(this);
            this.config = {
                speed: 30,
                areaNumber: 8 //奖区数量
            };
            this._transform = 'transform';
            this._runAngle = 0;
            this._targetAngle = -1;
            this.pointer = pointer;
            this.config = Tool.extends({}, this.config, config);
            //初始化样式设定
            this._transform = Tool.css(this.pointer, this._transform, 'translate3d(0,0,0)');
            Tool.css(this.pointer, 'backfaceVisibility', 'hidden');
            Tool.css(this.pointer, 'perspective', '1000px');
            //事件注入 (当设置结果时)
            this.on('__setResult', function (index) {
                //得到中奖结果 index:中奖奖区下标
                var singleAngle = 360 / _this.config.areaNumber, //单个奖区角度值
                endAngle = Math.ceil((Math.random() * singleAngle) + (index * singleAngle)); //随机得出结果角度
                _this._runAngle = 0;
                _this._targetAngle = endAngle + (Math.floor(Math.random() * 4) + 4) * 360; //随机旋转几圈再停止
            });
        }
        Dial.prototype.setResult = function (index) {
            this.trigger('__setResult', index);
        };
        Dial.prototype.reset = function (event) {
            if (event === void 0) { event = 'reset'; }
            if (!this._raf)
                return;
            window.cancelAnimationFrame(this._raf);
            this._raf = null;
            this._runAngle = 0;
            this._targetAngle = -1;
            this.trigger(event);
            if (event == 'reset')
                Tool.css(this.pointer, this._transform, 'translate3d(0,0,0) rotate(0deg)');
        };
        Dial.prototype.draw = function () {
            if (this._raf)
                return;
            var _draw = function () {
                var angle = 0;
                var step = function () {
                    //如果没有设置结束点 就匀速不停旋转
                    //如果设置了结束点 就减速到达结束点
                    if (this._targetAngle == -1) {
                        this._runAngle += this.config.speed;
                    }
                    else {
                        angle = (this._targetAngle - this._runAngle) / this.config.speed;
                        angle = angle > this.config.speed ? this.config.speed : angle < 0.5 ? 0.5 : angle;
                        this._runAngle += angle;
                        this._runAngle = this._runAngle > this._targetAngle ? this._targetAngle : this._runAngle;
                    }
                    //指针旋转
                    Tool.css(this.pointer, this._transform, 'translate3d(0,0,0) rotate(' + (this._runAngle % 360) + 'deg)');
                    if (this._runAngle == this._targetAngle) {
                        this.reset('end');
                    }
                    else {
                        this._raf = window.requestAnimationFrame(step.bind(this));
                    }
                };
                this._raf = window.requestAnimationFrame(step.bind(this));
            };
            this.has('start') ? this.trigger('start', _draw.bind(this)) : _draw.call(this);
        };
        return Dial;
    })(Events);
    Lottery.Dial = Dial;
    var Scratch = (function (_super) {
        __extends(Scratch, _super);
        function Scratch(canvas, config) {
            _super.call(this);
            this.config = {
                size: 20,
                percent: 50,
                variable: true //canvas的大小是否是可变的
            };
            this._state = 'load';
            this._touch = false;
            this._request = false;
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
        Scratch.prototype.setResult = function (url) {
            this.canvas.style.backgroundImage = 'url(' + url + ')';
        };
        Scratch.prototype.draw = function () {
            if (this._state == 'end')
                return;
            this.ctx.clearRect(0, 0, this.width, this.height);
            this._state = 'end';
            this.trigger('end');
        };
        Scratch.prototype.reset = function () {
            this._state = 'init';
            this._request = false;
            this._touch = false;
            this.canvas.style.backgroundImage = null;
            this._init();
            this.trigger('reset');
        };
        Scratch.prototype._init = function () {
            this._setCanvasSize();
            this._getCanvasOffset();
            this.ctx.closePath();
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = 'gray';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.globalCompositeOperation = 'destination-out';
        };
        Scratch.prototype._scratchPercent = function () {
            var hits = 0, imageData = this.ctx.getImageData(0, 0, this.width, this.height);
            for (var i = 0, ii = imageData.data.length; i < ii; i = i + 4) {
                if (imageData.data[i] === 0 && imageData.data[i + 1] === 0 && imageData.data[i + 2] === 0 && imageData.data[i + 3] === 0) {
                    hits++;
                }
            }
            return (hits / (this.width * this.height)) * 100;
        };
        Scratch.prototype._setCanvasSize = function () {
            this.width = this.canvas.clientWidth;
            this.height = this.canvas.clientHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        };
        Scratch.prototype._getCanvasOffset = function () {
            var box = this.canvas.getBoundingClientRect();
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
            var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
            var clientTop = document.documentElement.clientTop || document.body.clientTop || 0;
            var clientLeft = document.documentElement.clientLeft || document.body.clientLeft || 0;
            this.offsetX = Math.round(box.left + scrollLeft - clientLeft);
            this.offsetY = Math.round(box.top + scrollTop - clientTop);
        };
        Scratch.prototype._getEventXY = function (e) {
            e = e.changedTouches ? e.changedTouches[0] : e;
            return {
                x: e.pageX - this.offsetX,
                y: e.pageY - this.offsetY
            };
        };
        Scratch.prototype._onTouchStart = function (e) {
            e.preventDefault();
            if (this._state == 'end')
                return;
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
        };
        Scratch.prototype._onTouchMove = function (e) {
            e.preventDefault();
            if (!this._touch)
                return;
            var point = this._getEventXY(e);
            this.ctx.lineTo(point.x, point.y);
            this.ctx.stroke();
        };
        Scratch.prototype._onTouchEnd = function (e) {
            if (!this._touch)
                return;
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
        };
        Scratch.prototype._onResize = function () {
            this._touch = false;
            if (this.config.variable) {
                if (this._state == 'end') {
                    this._setCanvasSize();
                }
                else {
                    this._init();
                }
            }
            else {
                this._getCanvasOffset();
            }
        };
        return Scratch;
    })(Events);
    Lottery.Scratch = Scratch;
    var Tiger = (function (_super) {
        __extends(Tiger, _super);
        function Tiger(toggle, roller, config) {
            _super.call(this);
            this.config = {
                timeout: 300,
                timeDiff: 6000,
                variable: true //roller大小是否是可变的
            };
            this.rollerQueue = [];
            this.toggle = toggle;
            this.config = Tool.extends({}, this.config, config);
            //初始化滚轴
            for (var i = 0; i < roller.length; i++) {
                this.rollerQueue.push(new TigerRoller(roller[i], this.config.variable));
            }
        }
        Tiger.prototype.setResult = function (ret) {
            var _this = this;
            //保证动画执行时间
            var endTime = (new Date()).getTime();
            setTimeout(function () {
                for (var i = 0, l = _this.rollerQueue.length; i < l; i++) {
                    _this.rollerQueue[i].stop(ret[i], (i == l - 1 ? function () {
                        _this.toggle.classList.remove('z-active');
                        _this.trigger('end');
                    } : null), i * _this.config.timeout);
                }
            }, endTime - this._startTime > this.config.timeDiff ? 0 : this.config.timeDiff - (endTime - this._startTime));
        };
        Tiger.prototype.reset = function () {
            this.toggle.classList.remove('z-active');
            for (var i = 0, l = this.rollerQueue.length; i < l; i++) {
                this.rollerQueue[i].reset();
            }
            this.trigger('reset');
        };
        Tiger.prototype.draw = function () {
            if (this.toggle.classList.contains('z-active'))
                return;
            var _draw = function () {
                this.toggle.classList.add('z-active');
                for (var i = 0, l = this.rollerQueue.length; i < l; i++) {
                    this.rollerQueue[i].start(i * this.config.timeout);
                }
            };
            this._startTime = (new Date()).getTime();
            this.has('start') ? this.trigger('start', _draw.bind(this)) : _draw.call(this);
        };
        return Tiger;
    })(Events);
    Lottery.Tiger = Tiger;
})(Lottery || (Lottery = {}));
