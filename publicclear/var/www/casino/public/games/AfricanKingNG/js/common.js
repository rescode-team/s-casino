/* eslint complexity: 0 curly: 0*/

if (typeof window.nge === 'undefined')
    window.nge = {};

//Helper functions
nge.Common = {Lib:{Helper:{}}};

nge.Common.Lib.Helper= {
    getHtml: function(url, clbk){
        $.ajax({
            url: url,
            success: function(data){
                clbk(data);

                $('img.autoFix').error(function(){
                    var self = $(this);

                    setTimeout(
                        function(){
                            var src = self.attr('src');
                            var newSrc = ((src.indexOf('?') !== -1) ? src.substr(0, src.indexOf('?')) : src) + 
                                '?t=' + new Date().getTime();

                            self.attr('src', newSrc);
                        },
                        250 // delay
                    );
                });
            }
        });
    },
    infrequentHandler: function(func, delay){
        //func();
        var functionTimer = false;

        return function(){
            var args = arguments;

            if(functionTimer)
                clearTimeout(functionTimer);

            functionTimer = setTimeout(
                function(){
                    functionTimer = false;
                    func.apply(this, args);
                },
                delay
            );
        };
    },
    setObjKeyInPosition: function (key, keyIndex, value, object){
        var keys = Object.keys(object);
        var index = keys.indexOf(key);
        if(index >= 0)
            keys.splice(index, 1);
        keys.splice(keyIndex, 0, key);
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            var val = (keyIndex === i) ? 
                value : object[k];
            delete object[k];
            object[k] = val;
        }
        
        return object;
    },
    //only simple selectors
    _clonedStyles: [],
    objectClone: function(selector, newSelector){
        var i = 0,
            j = 0,
            copyKeys = ['x', 'y', 'scale.x', 'scale.y', 'anchorX', 'anchorY'],
            element,
            model,
            elements = nge.findAll(selector);

        //check partial entry in styles, maybe we shell copy some styles
        var styles = mt.data.styles;

        for (var k in styles)
            if(k.indexOf(selector) !== -1 && this._clonedStyles.indexOf(k) === -1){
                var newK = k.replace(selector, newSelector);
                var newKIndex = Object.keys(styles).indexOf(k) + 1;
                this.setObjKeyInPosition(newK, newKIndex, styles[k], styles);
                this._clonedStyles.push(k);
                this._clonedStyles.push(newK);
            }

        //cloning object
        for(i = 0; i < elements.length; i++){
            element = elements[i];

            if(element._cloned)
                continue;

            model = nge.Lib.Helper.jsObjClone(element.getData());
            var classIndex = false;

            //remove old selector and add new
            switch(selector.slice(0, 1)){
                case '#':
                    model.id = false;
                    break;
                case '^':
                    model.name = false;
                    break;
                case '.':
                    var classArr = model.class.split(' ');
                    classIndex = classArr.indexOf(selector.slice(1));
                    classArr.splice(classIndex, 1);
                    model.class = classArr.join(' ');
                    break;
                default:
                    console.error('nge.Common.Lib.Helper.objectClone selector error', selector, newSelector);
            }

            switch(newSelector.slice(0, 1)){
                case '#':
                    model.id = newSelector.slice(1);
                    break;
                case '^':
                    model.name = newSelector.slice(1);
                    break;
                case '.':
                    var classArrN = model.class.split(' ');

                    if(classIndex !== false){
                        classArrN.splice(classIndex, 0, newSelector.slice(1));
                    }else
                        classArrN.push(newSelector.slice(1));

                    model.class = classArrN.join(' ');
                    break;
                default:
                    console.error('nge.Common.Lib.Helper.objectClone newSelector error', selector, newSelector);
            }

            var newObject = nge.objects.create(model, element.parent);
            newObject.mt.data._originalModel = element.getData()._originalModel;

            for(j = 0; j < copyKeys.length; j++)
                nge.Lib.Helper.recursiveSet(
                    copyKeys[j],
                    nge.Lib.Helper.recursiveGet(copyKeys[j], element),
                    newObject
                );

            element.scale.x = 0;
            element.scale.y = 0;
            element.alpha = 0;
            element.visible = 0;
            element._cloned = true;

            nge.objects.setStyles(newObject);
        }
    },
    conditionCheck : function (condition, callback, delay, maxCycles, callAnywayFlag) {
        if (typeof maxCycles === 'undefined')
            maxCycles = 20;
        if (typeof delay === 'undefined')
            delay = 50;

        var res = condition();
        if (res) {
            callback();
            return true;
        }

        if (maxCycles > 1){
            var clbk = function () {
                nge.Common.Lib.Helper.conditionCheck(condition, callback, delay, maxCycles - 1, callAnywayFlag);
            };

            setTimeout(clbk, delay);
        }else if (callAnywayFlag) {
            callback();
            return true;
        }

        return false;
    },
    makeReactive: function (obj, key, callback) {
        var targetObject = obj;
        var descriptor = Object.getOwnPropertyDescriptor(targetObject, key);

        while (!descriptor && targetObject.__proto__) {
            targetObject = targetObject.__proto__;
            var descriptorTemp = Object.getOwnPropertyDescriptor(targetObject, key);

            if (descriptorTemp && (descriptorTemp.value || descriptorTemp.set || descriptorTemp.get))
                descriptor = descriptorTemp;
        }

        if (!descriptor) // bad descriptors and its IOS mobile
            return false;

        if(typeof descriptor.value !== 'undefined'){
            var value = descriptor.value;
            descriptor.get = function(){return value;};
            descriptor.set = function(v){value=v;};

            delete descriptor.value;
            delete descriptor.writable;
        }

        var setter = descriptor.set;

        descriptor.set = function (v) {
            if (setter)
                setter.call(obj, v);

            callback.call(obj, v);
        };

        Object.defineProperty(obj, key, descriptor);
        return true;
    }
};

nge.gameLoadingStartTime = new Date();

//parseGetParams
nge.parseGetParams = function (name) {
    var $_GET = {};
    //var _GET = window.location.hash.substring(1).split("?");
    var _GET = window.location.href.substring(1).split('?');
    if (_GET[1]) {
        var __GET = _GET[1].split('&');
        for (var i = 0; i < __GET.length; i++) {
            var getVar = __GET[i].split('=');
            $_GET[getVar[0]] = typeof getVar[1] === 'undefined' ? '' : getVar[1];
        }
    }

    if (!name)
        return $_GET;

    return $_GET[name];
};

//setStatisticsHandlers
nge.setStatisticsHandlers = function () {
    nge.HotPatches.init();

    //our own statistics
    var osInfo = nge.Lib.Helper.getOsAndVersion();

    nge.statisticsCollector.addEvent({
        name: 'environment',
        'params': {
            mobile: nge.Lib.Helper.mobileAndTabletCheck(),
            os: osInfo.os + ' ' + osInfo.version,
            browser: nge.Lib.Helper.browserDetect(),
            userAgent: navigator.userAgent,
            gameCode: nge.Cfg.Main.gameCode,
            gameName: nge.Cfg.Main.title,
            version: nge.Cfg.Main.version,
            apiVersion: nge.Cfg.Main.apiVersion,
            gameVersion: nge.Cfg.Main.gameVersion,
            userId: nge.Lib.Helper.parseGetParams('userId'),
            pixelRatio: devicePixelRatio,
            screenSize: screen.availWidth + 'x' + screen.availHeight,
            winSize: $(window).width() + 'x' + $(window).height()
        }
    }, true);

    nge.observer.add('game.readyToPlay', function (state) {
        var loadingTime = new Date() - nge.gameLoadingStartTime;

        nge.statisticsCollector.addEvent({
            name: 'launchGame',
            'params': {
                loadingTime: loadingTime //in ms
            }
        });

        nge.observer.remove('game.readyToPlay', false, 'statisticsCollectorOneTimeHandler', true);
    }, 'statisticsCollectorOneTimeHandler', true);

    nge.observer.add('fatal.error', function (data) {
        nge.statisticsCollector.addEvent({
            name: 'fatalError',
            'params': {
                title: data.title,
                description: data.description
            }
        });

        nge.observer.remove('game.readyToPlay', false, 'statisticsCollectorFatalError', true);
    }, 'statisticsCollectorFatalError', true);
};

//posWarning  && fullscreen
(function () {
    var _readyToPlay = false;
    var _orientationController;
    var _fullscreenController;
    var _isMobileOrTablet = false;

    var _getDevice = function () {
        return (nge.device) ? nge.device : nge.game.device;
    };

    var isPortrait = function () {
        return $(window).width() < $(window).height();
    };

    var Fullscreen = function () {
        var _isAdaptive = null;
        var _touchInProgress = false;
        var _hide = null;
        var _wasShown = false;
        var _isFullscreen = false;
        var _fullscreenMessageLayer;
        var _browserCheckerAnimation;
        var _isUiWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);

        var _touchStartScreenEnded = false;

        var device = {
            pixelRatio: window.devicePixelRatio || 1,
            iPhone: navigator.userAgent.toLowerCase().indexOf('iphone') !== -1
        };

        var _isIphone5 = device.pixelRatio === 2 && device.iPhone &&
            ((screen.availWidth === 320 && screen.availHeight === 568) || (screen.availWidth === 568 && screen.availHeight === 320));

        if(device.iPhone){
            window.addEventListener('touchmove', function(e) {
                _touchInProgress = true;
                var actionNeeded = $('#browserCheckerWrapper').css('visibility') === 'visible';
                var multiplyTouches = e.touches && e.touches.length > 1;
                // fixing zoom in and zoom out pan gesture
                var scaleNotOne = e.scale !== 1;

                // TODO: Bad check! Maybe need special class to html paytable elements(no-pan)
                // fixing html paytable swipes 
                var stopMenuTouchMove = e.target.className.indexOf('menu') !== -1 || e.target.className.indexOf('sidebar') !== -1;
                
                if(stopMenuTouchMove)
                    e.preventDefault();

                if(nge && nge.localData && nge.localData.get('allowTouchmove') && !multiplyTouches)
                    return false;

                if(!actionNeeded || multiplyTouches || scaleNotOne || _isIphone5)
                    e.preventDefault();

            }, { passive:false });

            window.addEventListener('touchend', function(e) {
                _touchInProgress = false;
            });
        }

        var _checkWindowFullscreen = function () {
            if (typeof document.isFullScreen !== 'undefined')
                return document.isFullScreen;
            else if (typeof document.mozFullScreen !== 'undefined')
                return document.mozFullScreen;
            else if (typeof document.webkitIsFullScreen !== 'undefined')
                return document.webkitIsFullScreen;
        };

        var _isChromeIOS = function () {
            return _getDevice().iOS && navigator.userAgent.indexOf('CriOS') !== -1;
        };

        var _fullscreenModeOn = function () {
            if (_isFullscreen)
                return;

            var element = document.body;
            if (!element)
                return false;

            if (element.requestFullScreen)
                element.requestFullScreen();
            else if (element.webkitRequestFullScreen)
                element.webkitRequestFullScreen();
            else if (element.mozRequestFullScreen)
                element.mozRequestFullScreen();

            _isFullscreen = true;
            nge.localData.set('fullscreen.enabled', true);
            return true;
        };

        var _switchFullscreenMessageVisible = function (visible) {
            var display = (visible && !_isIphone5 && !_getDevice().iPad) ? 'visible' : 'hidden';
            var bodyStyle = (visible && !_isIphone5) ? window.innerHeight * 1.6 + 'px' : window.innerHeight;

            if (_browserCheckerAnimation) {
                _browserCheckerAnimation.style.display = display;
                document.body.style.height = bodyStyle;
            }
            
            if (_fullscreenMessageLayer) {
                if (_getDevice().iOS && (_isUiWebView))
                    display = 'hidden';

                document.body.style.position = (display !== 'none') ? 'initial' : 'fixed';
                
                _fullscreenMessageLayer.style.visibility = display;
                _fullscreenMessageLayer.style.display = 'block';
            }

            if(_getDevice().iPad)
                return;

            var overflow = (display !== 'none') ? 'initial' : 'hidden';
            
            $('html').css({ overflow: overflow });
            $('body').css({ overflow: overflow });
        };

        this.windowOrientationCheck = function () {
            if (_isFullscreen && !_checkWindowFullscreen())
                nge.observer.fire('fullscreen.off');
            if (_isMobileOrTablet && !_checkWindowFullscreen()) {
                _isFullscreen = false;
                _touchStartScreenEnded = false;
                // if (!_wasShown)
                //     _switchFullscreenMessageVisible(true);
            }
        };

        var _timeoutChecker = function (callback, conditionFunc, timeSpan) {
            setTimeout(function () {
                if (conditionFunc()) {
                    if (callback)
                        callback();
                } else {
                    _timeoutChecker(callback, conditionFunc, timeSpan);
                }
            }, timeSpan);
        };

        var _forceWindowResizeIosSafari = function () {
            if (_isChromeIOS()){
                if(_getDevice().iPad)
                    $('body').css({ width: window.outerWidth });
                return;
            }

            var _sysInstancesModes = nge.localData.get('_sysInstancesModes');
            var isPortraitMode = _sysInstancesModes && _sysInstancesModes.indexOf('portrait') !== -1;

            _checkIsAdaptive();

            var hideByHeight = $(window).height() === window.innerHeight || (isPortraitMode && _isAdaptive);

            var osAndVersion = nge.Lib.Helper.getOsAndVersion();
            if (osAndVersion.os === 'iOS') {
                var versions = osAndVersion.version.split('.');
                if (+versions[0] >= 15 || +versions[0] === 14 && +versions[1] >= 2)
                    hideByHeight = $(window).height() !== window.innerHeight;
            }

            var hideHand = hideByHeight &&
                $(window).width() === window.innerWidth;
            var y = document.body.getBoundingClientRect().y;

            if (y !== 0 && !_touchInProgress)
                window.scroll(0, 0);

            if((isPortraitMode && _isAdaptive) && $(window).height() === window.innerHeight){
                hideHand = false;
            }

            if(_getDevice().iPad){
                hideHand = $(window).height() !== window.innerHeight
            }

            _hide = !hideHand;

            _switchFullscreenMessageVisible(_hide);
        };

        var _checkIsAdaptive = function(){
            if(_isAdaptive === null){
                if (typeof nge.Cfg.Resolutions !== 'function'){
                    //old code
                    _isAdaptive = false;
                    return false;
                }

                var cfgResolution = nge.App.getInstance('Cfg.Resolutions');

                if(cfgResolution){
                    var resolutionParams = cfgResolution.get();
                    var param = resolutionParams.filter(function (r){
                        return r.name === 'portrait';
                    })[0];
                    
                    _isAdaptive = param && param.adaptive || false;
                }
            }
        };

        this.init = function () {
            var isCanvasCreated = function () {
                return nge && nge.observer && nge.localData && document.getElementsByTagName('canvas')[0];
            };

            var initializeFullscreen = function () {
                // append HTML
                if (!_isMobileOrTablet) {
                    _isFullscreen = _checkWindowFullscreen();
                    return;
                }

                var isChrome = _isChromeIOS();

                var onHTMLLoaded = function (html) {

                    if (!_browserCheckerAnimation) {
                        $('body').append(html);
                        _browserCheckerAnimation = $('#browserCheckerWrapper')[0];
                        _fullscreenMessageLayer = $('#browserChecker')[0];
                        nge.observer.add('window.resize', function(){
                            if($('#posWarningLayer')[0].style.display !== 'block')
                                _forceWindowResizeIosSafari();
                        }, false, true);
                    } else if (!_wasShown) {
                        _switchFullscreenMessageVisible(true);
                    } else
                        return;

                    _fullscreenController.windowOrientationCheck();

                    var resizeTimeout;

                    var forceWindowResize = function () {
                        // if (!isChrome)
                        _forceWindowResizeIosSafari();
                        // else
                        //     _forceWindowResizeIosChrome();
                    };

                    $(document).on('DOMContentLoaded', forceWindowResize);

                    $(window).on('resize', function () {
                        if (isPortrait())
                            return _switchFullscreenMessageVisible(false);

                        clearTimeout(resizeTimeout);
                        resizeTimeout = setTimeout(function () {
                            forceWindowResize();
                        }.bind(this), 100);
                    });

                    $(window).on('scroll', function () {
                        if (isChrome)
                            return;

                        clearTimeout(resizeTimeout);
                        resizeTimeout = setTimeout(function () {
                            forceWindowResize();
                        }.bind(this), 100);
                    });

                    forceWindowResize();
                };

                var onStartScreenLoaded = function (html) {
                    html = _localizationApply(html);

                    if (!_fullscreenMessageLayer) {
                        $('body').append(html);
                        _fullscreenMessageLayer = $('#startScreenLayer')[0];
                    } else
                        _fullscreenMessageLayer.style.display = 'block';

                    _touchStartScreenEnded = false;
                    _readyToPlay = false;

                    $(window).on('touchend', function () {
                        if (!_touchStartScreenEnded) {
                            _fullscreenMessageLayer.style.display = 'none';
                            _touchStartScreenEnded = true;
                            _wasShown = true;
                            _fullscreenModeOn();
                            _orientationController.windowOrientationCheck();
                            _readyToPlay = true;
                        }
                    });

                    $(window).on('resize', function () {
                        nge.game.scale.pageAlignVertically = isPortrait();
                    });
                };

                nge.observer.add('game.readyToPlay', function (state) {
                    nge.observer.remove('game.readyToPlay', false, true);
                    if (_wasShown)
                        return;

                    nge.game.scale.pageAlignVertically = true;

                    // _checkIsAdaptive();
                    _forceWindowResizeIosSafari();
                    // _switchFullscreenMessageVisible(!isPortrait());

                    if (!_getDevice().iOS) {
                        nge.Common.Lib.Helper.getHtml('../../tpl/startScreen/startScreen.html', onStartScreenLoaded);
                    } else {
                        nge.Common.Lib.Helper.getHtml('../../tpl/browserChecker/browserCheckerIOS.html', onHTMLLoaded);

                        _orientationController.windowOrientationCheck();
                        _readyToPlay = true;
                    }
                }, false, true);

                _isFullscreen = _checkWindowFullscreen();
            };

            _timeoutChecker(initializeFullscreen, isCanvasCreated, 500);
        };
    };


    var ScreenOrientation = function () {
        this.posWarningLayer = null;
        var _orientCtx = this;

        this.windowOrientationCheck = function () {
            if (!_orientCtx || !_orientCtx.posWarningLayer || !_orientCtx.posWarningLayer.style)
                return;

            var availableOrientations = ['album'];

            if (typeof nge.Cfg.Resolutions === 'function')
                availableOrientations = nge.App.getInstance('Cfg.Resolutions').orientationsStrings(); //todo use only this string

            var portrait = isPortrait();
            var block = ((portrait && availableOrientations.indexOf('portrait') === -1) || (!portrait && availableOrientations.indexOf('album') === -1));
            _orientCtx.posWarningLayer.style.display = block ? 'block' : 'none';
        };

        this.init = function () {
            var ios = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
            nge.Common.Lib.Helper.getHtml(
                '../../tpl/posWarning/poswarningIOS.html',
                function (html) {
                    html = _localizationApply(html);
                    $('body').append(html);
                    _orientCtx.posWarningLayer = $('#posWarningLayer')[0];
                }
            );
        };
    };

    var _checkMobileOrTablet = function () {
        var check = false;
        (function (a) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
                check = true;
        })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
    };

    var _windowOrientationCheck = function () {
        if (_orientationController && _readyToPlay)
            _orientationController.windowOrientationCheck();
        if (_fullscreenController)
            _fullscreenController.windowOrientationCheck();
    };

    (function () {
        _isMobileOrTablet = _checkMobileOrTablet();

        $(window).on('resize', _windowOrientationCheck);

        $(window).on('orientationchange', function () {
            setTimeout(function () {
                _windowOrientationCheck();
            }, 100);
        });

        if (_isMobileOrTablet) {
            _orientationController = new ScreenOrientation();
            _orientationController.init();
        }

        _fullscreenController = new Fullscreen();
        _fullscreenController.init();
    })();

    var _showLoaderMessage = function(text) {
        // TODO: _showLoaderMessage(_localizationApply('{{mobileVersionRecommended}}'));
        var msg = $('#loader-message');
        msg.html(text);
        msg.show();
    };

    var _localizationApply = function (str) {
        var lang = nge.parseGetParams('lang') || 'en';

        if (!lang || !_globalTranslations[lang])
            return str;

        var newStr = str;
        for (var k in _globalTranslations[lang]) {
            newStr = newStr.replace('{{' + k + '}}', _globalTranslations[lang][k]);
        }

        return newStr;
    };

    $(document).on('loaderTplAppended', function () {
        nge.loaderTplAppendedTime = new Date();
        var reloadButton = document.querySelector('.reload-button');

        if (reloadButton)
            reloadButton.innerHTML = _localizationApply(reloadButton.innerHTML);

        //ipadOS warning
        if(/Mac OS/.test(navigator.userAgent) && navigator.maxTouchPoints && navigator.maxTouchPoints > 1){
            var mobile = false;
            (function (a) {
                if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
                    mobile = true;
            })(navigator.userAgent || navigator.vendor || window.opera);

            if(!mobile)
                _showLoaderMessage(_localizationApply('{{mobileVersionRecommended}}'));
        }
    });

    var _globalTranslations = {
        "en": {
            'TouchToStart': 'Touch to start',
            'PleaseTurnYourDeviceToLandscapeMode': 'Please turn your device to<br>landscape mode!',
            'reloadGame': 'RELOAD GAME',
            'mobileVersionRecommended': 'For best experience on this device,<br>we recommend to use mobile version of browser.'
        },
        "ru": {
            'TouchToStart': 'Коснитесь экрана',
            'PleaseTurnYourDeviceToLandscapeMode': 'Поверните устройство,<br>чтобы начать игру!',
            'reloadGame': 'ПЕРЕЗАГРУЗИТЬ ИГРУ',
            'mobileVersionRecommended': 'Для лучшей работы на данном устройстве<br>мы рекомендуем использовать мобильную версию браузера.'
        },
        "de": {
            'TouchToStart': 'Tippen um fortzufahren',
            'PleaseTurnYourDeviceToLandscapeMode': 'Bitte schalten sie ihr gerät in den landschaftsmodus!',
            'reloadGame': 'LADE DAS SPIEL NEU',
            'mobileVersionRecommended': 'Für die beste Erfahrung auf diesem Gerät empfehlen<br>wir die Verwendung der mobilen Version des Browsers.'
        },
        "es": {
            'TouchToStart': 'Pulsa para continuar',
            'PleaseTurnYourDeviceToLandscapeMode': '¡Por favor, convierte tu dispositivo en modo horizontal!',
            'reloadGame': 'RECARGAR EL JUEGO',
            'mobileVersionRecommended': 'Para obtener la mejor experiencia en este dispositivo,<br>recomendamos que utilices la versión móvil del navegador.'
        },
        "tr": {
            'TouchToStart': 'Devam etmek için dokunun',
            'PleaseTurnYourDeviceToLandscapeMode': 'Cihazınızı lütfen manzara moduna getirin!',
            'reloadGame': 'OYUNU TEKRAR YÜKLEYİN',
            'mobileVersionRecommended': 'Bu aygıtta en iyi deneyimi sağlamak için,<br>tarayıcınızın mobil versiyonunu kullanmanızı tavsiye ederiz.'
        },
        "it": {
            'TouchToStart': 'Sfiora per continuare',
            'PleaseTurnYourDeviceToLandscapeMode': 'Imposta la modalità orizzontale del dispositivo!',
            'reloadGame': 'RICARICA IL GIOCO',
            'mobileVersionRecommended': 'Per una migliore esperienza su questo dispositivo,<br>consigliamo di utilizzare la versione mobile del browser.'
        },
        "fr": {
            'TouchToStart': 'Appuyer pour continuer',
            'PleaseTurnYourDeviceToLandscapeMode': 'Euillez régler votre appareil sur le mode paysage!',
            'reloadGame': 'RECHARGER LE JEU',
            'mobileVersionRecommended': 'Pour profiter au mieux de votre expérience sur cet appareil,<br>nous vous recommandons d\'utiliser la version mobile de votre navigateur.'
        },
        "pt": {
            'TouchToStart': 'Toque para começar',
            'PleaseTurnYourDeviceToLandscapeMode': 'Passe o seu dispositivo a modo paisagem!',
            'reloadGame': 'RECARREGAR O JOGO',
            'mobileVersionRecommended': 'Para uma melhor experiência neste dispositivo,<br>recomendamos que use a versão móvel do navegador.'
        },
        "ar": {
            'TouchToStart': 'المس للبدء',
            'PleaseTurnYourDeviceToLandscapeMode': '!يرجى تحويل جهازك إلى وضع أفقي',
            'reloadGame': 'إعادة تحميل اللعبة',
            'mobileVersionRecommended': 'نوصي باستخدام نسخة المتصفح للهاتف النقال<br>لأفضل تجربة على هذا الجهاز'
        },
        "zh": {
            'TouchToStart': '开始触摸',
            'PleaseTurnYourDeviceToLandscapeMode': '请将您的设备切换<br>到横屏模式!',
            'reloadGame': '重新载入游戏',
            'mobileVersionRecommended': '为了获得最佳的使用体验，<br>我们建议使用移动版本的浏览器。'
        },
        "ja": {
            'TouchToStart': 'タッチして開始',
            'PleaseTurnYourDeviceToLandscapeMode': '機器を横向きモードにしてください！',
            'reloadGame': 'ゲームを再読み込み',
            'mobileVersionRecommended': 'この機器で最高の体験をするにはモバイルバ<br>ージョンのブラウザを使用する事をお勧めします。'
        },
        "th": {
            'TouchToStart': 'แตะเพื่อเริ่ม',
            'PleaseTurnYourDeviceToLandscapeMode': 'กรุณาหมุนอุปกรณ์ของคุณเพื่อให้อยู่ในโหมดแนวนอน!',
            'reloadGame': 'รีโหลดเกม',
            'mobileVersionRecommended': 'เราขอแนะนำให้ใช้งานเบราว์เซอร์ที่เป็นเวอร์ชั่นมือถื<br>อเพื่อการได้รับประสบการณ์ที่ดีที่สุดบนอุปกรณ์ชิ้นนี้'
        },
        "id": {
            'TouchToStart': 'Sentuh untuk mulai',
            'PleaseTurnYourDeviceToLandscapeMode': 'Harap ubah perangkat Anda ke mode lanskap!',
            'reloadGame': 'MUAT ULANG GAME',
            'mobileVersionRecommended': 'Untuk pengalaman terbaik di perangkat ini,<br>kami sarankan menggunakan peramban versi ponsel.'
        },
        "ms": {
            'TouchToStart': 'Sentuh untuk mulakan',
            'PleaseTurnYourDeviceToLandscapeMode': 'Sila ubah peranti anda ke mod landskap!',
            'reloadGame': 'MEMUAT PERMAINAN',
            'mobileVersionRecommended': 'Untuk pengalaman terbaik pada peranti ini,<br>kami syorkan untuk guna pelayar versi mudah alih.'
        },
        "vi": {
            'TouchToStart': 'Chạm để bắt đầu',
            'PleaseTurnYourDeviceToLandscapeMode': 'Vui lòng chuyển thiết bị của bạn sang chế độ cảnh quan!',
            'reloadGame': 'TẢI LẠI TRÒ CHƠI',
            'mobileVersionRecommended': 'Bạn nên sử dụng phiên bản di động<br>để có được trải nghiệm tốt nhất trên thiết bị.'
        },
        "hi": {
            'TouchToStart': 'शुरू करने के लिए छूएं',
            'PleaseTurnYourDeviceToLandscapeMode': 'कृपया अपने उपकरण को लैडस्कैप मोड में घुमाएँ!',
            'reloadGame': 'गेम रिलोड करें',
            'mobileVersionRecommended': 'इस उपकरण पर अच्छे अनुभव के लिए,<br>हम आपको ब्राउज़र के मोबाइल संस्करण को इस्तेमाल करने की सिफारिश करते हैं।'
        },
        "ko": {
            'TouchToStart': '시작하려면 터치',
            'PleaseTurnYourDeviceToLandscapeMode': '디바이스를 가로 모드로 돌리세요!',
            'reloadGame': '게임 재시작',
            'mobileVersionRecommended': '해당 디바이스에서 최고의 경험을 위해,<br>모바일 버전 브라우저 사용을 권장합니다.'
        },
        "sv": {
            'TouchToStart': 'Tryck för att starta',
            'PleaseTurnYourDeviceToLandscapeMode': 'Vänd din enhet till landskapsläge!',
            'reloadGame': 'LADDA OM SPELET',
            'mobileVersionRecommended': 'För bästa upplevelse på den här enheten rekommenderar<br>vi att du använder den mobila versionen av webbläsaren.'
        }
    };
})();

//statisticsCollector instance
nge.statisticsCollector = new function () {
    var _apiUrl = '/game/AfricanKingNG/server?sessionId='+sessionStorage.getItem('sessionId');
    var _sesId = false;
    var _query = [];
    var _lastSendCall;

    this.init = function () {
        if (_apiUrl.indexOf('URL_STATISTICS_COLLECTOR') === 1)
            _apiUrl = false;

        _send({action: 'InitRequest'});
    };

    this.addEvent = function (data, dontSendNowFlag) {
        _store(data, dontSendNowFlag);
    };

    var _store = function (data, dontSendNowFlag) {
        _query.push(data);

        if (!dontSendNowFlag)
            _chkStorage();

        return true;
    };

    var _chkStorage = function () {
        if (_query.length === 0)
            return false;

        //check _sesId. If no _sesId, then we will wait for init responce
        if (!_sesId) {
            //something went wrong
            var condition = function () {
                return _sesId;
            };

            nge.Lib.Checker.delay(condition, _chkStorage, 500, 100);
        }

        _lastSendCall = new Date();

        if (_query.length === 1)
            _sendSingle();
        else
            _sendAll();
    };

    var _sendSingle = function () {
        var data = _query.shift();
        _send({'action': 'EventRequest', 'data': data});
    };

    var _sendAll = function () {
        _send({'action': 'EventsRequest', 'data': {events: _query}});
        _query = [];
    };

    var _Model = function (options) {
        return {
            action: options && options.action || 'none',
            sesId: options && options.sesId || _sesId,
            result: options && options.result || true,
            data: options && options.data || {}
        };
    };

    var _send = function (packageName) {
        if (!_apiUrl)
            return false;

        $.ajax({
            type: 'POST',
            url: _apiUrl,
            data: JSON.stringify(new _Model(packageName)),
            success: _receive,
            error: function(){setTimeout(function(){_send(packageName);}, 1000);},
            contentType: 'application/json',
            crossOrigin: true
        });
    };

    var _receive = function (data) {
        if (typeof data === 'string')
            data = JSON.parse(data);

        if (data && data.sesId)
            _sesId = data.sesId;
    };
};
nge.statisticsCollector.init();

nge.HotPatches = {done:false};

nge.HotPatches.patches = {
    phaserChromeSoundFix:{
        1: function(){
            //адский костыль - надо его выпилить к монахам и сделать по человечески
            //фикс AudioContext resume при запуске в айфрейме для хрома
            nge.AudioContextFixed = false;

            if (typeof Phaser !== 'undefined' && typeof Phaser.VERSION !== 'undefined') {
                document.onclick = function () {
                    if (!nge.AudioContextFixed && nge.game && nge.game.sound && nge.game.sound.context)
                        nge.game.sound.context.resume();

                    nge.AudioContextFixed = true;
                };
            }
        }
    },
    ipadOsPhaserFix:{
        1: function(){
            //hack for buttons //Ipad OS with Phaser
            if(typeof Phaser !== 'undefined' && typeof Phaser.VERSION !== 'undefined' &&
                nge.game.device.macOS && navigator.maxTouchPoints && navigator.maxTouchPoints > 1){
                nge.game.input.mspointer._onMSPointerDown = null;
                nge.game.input.mspointer.start();
            }
        }
    },
    chromeBlursLengthFix:{
        1: function(){
            //canvas images size fix chrome 77 or higher on Androin and Ubuntu
            //bad hack for large textures in blurs //TODO remove as soon as we can
            if (nge.Lib.Helper.browserDetect() === 'Chrome') {

                var ua = navigator.userAgent;
                var uam = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];

                if (uam[2] >= 77)//77 Chrome mobile or higher
                    if (typeof Phaser !== 'undefined' && typeof Phaser.VERSION !== 'undefined') {
                        var blursCrutch = false;

                        var smCfg = nge.App.getInstance('Com.SlotMachine.Cfg');
                        var smTh = smCfg.get().th;
                        var smMh = smCfg.get().mh;

                        for (var i = 0; i < smTh.length; i++)
                            if (!blursCrutch && smTh[i] > 15) { // blursCrutch flag garants one time call
                                var newThs = [];
                                var addBlurs = [];

                                for (var j = 0; j < smTh.length; j++) {
                                    var newTh = 3;

                                    if (smMh <= 3){ //tempBlurs have just 3 symbols
                                        var addBlursReel = ~~((smTh[j] - 3) / 3);
                                        newTh = smTh[j] - (addBlursReel * 3);

                                        addBlurs.push(addBlursReel);
                                    }else
                                        newTh = ~~(smMh + j * (15 - smMh) / (smTh.length - 1)); //smMh-15 size of blurs

                                    newThs.push(newTh);
                                }

                                smCfg.set('th', newThs);

                                // if SM height > 3 we cant use additional blurs
                                if (smMh <= 3) {
                                    nge.observer.add('slotMachine.spinResponse', function () {
                                        nge.localData.set('slotMachineAdditionalBlurs', addBlurs);
                                    }, 'blursCrutch', true);
                                }

                                blursCrutch = true;
                            }
                    }
            }
        }
    },
    paidJackpots:{
        1: function(){
            var paidJackpots = false;

            var jackpotCost = 0;

            nge.Lib.Helper.recursiveSet(
                'App.' + nge.appNS + '.Mlm.Transport.Models.JackpotResponse',
                function (options) {
                    return {
                        'action': 'JackpotResponse',
                        'result': nge.Lib.Helper.recursiveGet('result', options, false),
                        'sesId':  nge.Lib.Helper.recursiveGet('sesId', options, false),
                        'data': {
                            'timer':    nge.Lib.Helper.recursiveGet('data.timer', options, 0),
                            'canPlay':  nge.Lib.Helper.recursiveGet('data.canPlay', options, false),
                            'jackpots': nge.Lib.Helper.recursiveGet('data.jackpots', options, []),
                            'jackpotPaid': nge.Lib.Helper.recursiveGet('data.jackpotPaid', options, false),
                            'jackpotCost': nge.Lib.Helper.recursiveGet('data.jackpotCost', options, false)
                        }
                    };
                },
                nge
            );

            var paidJackpotsLogic = function(){
                var UpdateOriginal = nge.brain._logicBlocksInstances.game.updateBalance;
                nge.brain._logicBlocksInstances.game.updateBalance = function () {
                    var totalAmount = nge.localData.get('balance.totalAmount');
                    var amountWithoutJackpot = totalAmount - jackpotCost;

                    // if balance is less then jackpot costs no need update localData 
                    if(amountWithoutJackpot < 0)
                        return false;

                    nge.localData.set('balance.totalAmount', amountWithoutJackpot);

                    var result = UpdateOriginal();

                    // if balance was less then totalBet then restore balance to initial value 
                    if(!result) 
                        nge.localData.set('balance.totalAmount', totalAmount);

                    return result;
                };
            };

            nge.observer.add('transportMessage.JackpotResponse',
                function (data) {
                    if(paidJackpots)
                        return true;

                    var jrData = data.data;

                    if ((jrData.jackpotPaid === true || jrData.jackpotPaid === 'true') && +jrData.jackpotCost > 0) {
                        jackpotCost = +jrData.jackpotCost;
                        paidJackpots = true;
                        log('paidJackpots mode');

                        nge.localData.set('jackpot.jackpotCost', jackpotCost);

                        // need update totalBet
                        // totalBetUpdate();
                        nge.observer.fire('paidJackpot.totalBetUpdate');

                        //paidJackpots mode
                        paidJackpotsLogic();
                    }
                },
                false,
                true
            );
        }
    },
    instantJackpots:{
        1: function(){
            var instantJackpotsMode = false;
            var jackpotWinned = false;
            //path, appOnlyFlag, noModes, modeName

            //step 1 - supported SweepStakes in AuthRequest
            var FeaturesClass = nge.App.getPath('Mlm.Brain.FeaturesCfg', false, 'instantJackpots'); //how to ?!
            var features = new FeaturesClass();
            features.supported.push('InstantJackpots');

            nge.Lib.Helper.recursiveSet(
                'App.' + nge.appNS + '.Mlm.Brain.FeaturesCfg',
                Class.extend(function () {
                    this.singleton = true;
                    this.required = features.required;
                    this.supported = features.supported;
                }),
                nge
            );

            //step 2 - check gameModes and search for instantJackpots
            var authResponseModelHardcode = function(d) {
                return {
                    action: 'AuthResponse',
                    result: nge.Lib.Helper.recursiveGet('result', d, !1),
                    sesId: nge.Lib.Helper.recursiveGet('sesId', d, !1),
                    data: {
                        betMultiplier: nge.Lib.Helper.recursiveGet('data.betMultiplier', d, false),
                        snivy: nge.Lib.Helper.recursiveGet('data.snivy', d, !1),
                        sessionId: nge.Lib.Helper.recursiveGet('data.sessionId', d, !1),
                        bets: nge.Lib.Helper.recursiveGet('data.bets', d, []),
                        extraBet: nge.Lib.Helper.recursiveGet('data.extraBet', d, 0),
                        coinValues: nge.Lib.Helper.recursiveGet('data.coinValues', d, []),
                        defaultCoinValue: nge.Lib.Helper.recursiveGet('data.defaultCoinValue', d, 1),
                        defaultBet: nge.Lib.Helper.recursiveGet('data.defaultBet', d, !1),
                        defaultLines: nge.Lib.Helper.recursiveGet('data.defaultLines', d, []),
                        gameModes: nge.Lib.Helper.recursiveGet('data.gameModes', d, 0),
                        gameParameters: {
                            availableLines: nge.Lib.Helper.recursiveGet('data.gameParameters.availableLines', d, []),
                            payouts: nge.Lib.Helper.recursiveGet('data.gameParameters.payouts', d, []),
                            initialSymbols: nge.Lib.Helper.recursiveGet('data.gameParameters.initialSymbols', d, []),
                            rtp: nge.Lib.Helper.recursiveGet('data.gameParameters.rtp', d, false)
                        },
                        supportedFeatures: nge.Lib.Helper.recursiveGet('data.gameParameters.supportedFeatures', d, []),
                        jackpotsEnabled: nge.Lib.Helper.recursiveGet('data.jackpotsEnabled', d, !1),
                        noChance: {
                            nextWin: nge.Lib.Helper.recursiveGet('data.noChance.nextWin', d, 0),
                            nextRows: nge.Lib.Helper.recursiveGet('data.noChance.nextRows', d, [])
                        },
                        restoredGameCode: nge.Lib.Helper.recursiveGet('data.restoredGameCode', d, !1),
                        lastResponse: nge.Lib.Helper.recursiveGet('data.lastResponse', d, !1),
                        actions: nge.Lib.Helper.recursiveGet('data.actions', d, []),
                        errorCode: nge.Lib.Helper.recursiveGet('data.errorCode', d, !1),
                        description: nge.Lib.Helper.recursiveGet('data.description', d, !1)
                    }
                };
            };

            var AuthResponseModelPath = nge.App.getPath('Mlm.Transport.Models.AuthResponse', false, 'instantJackpots');
            var testInstance = new AuthResponseModelPath();
            var authResponseModel = authResponseModelHardcode;

            if(testInstance.customConstructor){
                authResponseModel = AuthResponseModelPath.extend(function () {
                    this.customConstructor = function (options) {
                        this.super.customConstructor(options);
                        const gameModes = nge.Lib.Helper.recursiveGet('data.gameModes', options, 0);
                        this.data.gameModes = gameModes;
                    };
                });
            }


            nge.Lib.Helper.recursiveSet(
                'App.' + nge.appNS + '.Mlm.Transport.Models.AuthResponse',
                authResponseModel,
                nge
            );
            nge.observer.add('transportMessage.AuthResponse',
                function (data) {
                    if(instantJackpotsMode)
                        return true;

                    var aData = data.data;

                    if (aData.gameModes && aData.gameModes.indexOf('InstantJackpots') !== -1) {
                        instantJackpotsMode = true;
                        log('instantJackpotsMode mode');

                        //instantJackpots mode
                        instantJackpotsPopupLogic();
                    }
                },
                false,
                true
            );

            var updateBalance = function () {
                var isSweepStakes = nge.localData.get('sweepStakes.enabled');
                var balanceSelector = isSweepStakes ? '.balanceNumberClone' : '.balanceNumber';
                var creditsSelector = isSweepStakes ? '.creditsNumberClone' : '.creditsNumber';
                var data = nge.localData.get('balance');
                var balanceNumbers = nge.findAll(balanceSelector);
                var creditsAmounts = nge.findAll(creditsSelector);
                var currency = data.currency || nge.localData.get('balance.currency');
                var bText = parseFloat(data.totalAmount).toFixed(2) + ' ' + currency;
                var cText = nge.Lib.Money.toCoinsInt(data.totalAmount);
                var maxWidth = false;
                var currencyColor = false;

                var balanceComOriginal = nge.App.getInstance('Com.Balance.Controller');
                if(balanceComOriginal && balanceComOriginal.maxWidth)
                    maxWidth = balanceComOriginal.maxWidth;
                if(balanceComOriginal && balanceComOriginal.currencyColor)
                    currencyColor = balanceComOriginal.currencyColor;
                if (nge.localData.get('uiType') === 'gold') { //if in game no ui_v3 instance modes
                    currencyColor = '#EFC273';
                } else if (nge.localData.get('uiType') === 'blue') {
                    currencyColor = '#CAEAFF';
                } else if (nge.localData.get('uiType') === 'silver') {
                    currencyColor = '#DDDDDD';
                }

                if(isSweepStakes){
                    var text = nge.Lib.Money.toCoinsInt(data.totalAmount) +
                    ' / ' +
                    parseFloat(data.totalAmountReal).toFixed(2) +
                    ' ' + currency;

                    for (var k in creditsAmounts) {
                        creditsAmounts[k].text = text;
                        if(creditsAmounts[k].maxSizeResize)
                            creditsAmounts[k].maxSizeResize('width', maxWidth);
                    }

                    for (var k in balanceNumbers) {
                        balanceNumbers[k].text = text;
                        if(balanceNumbers[k].maxSizeResize)
                        balanceNumbers[k].maxSizeResize('width', maxWidth);
                    }
                    return;
                }


                for (var k in creditsAmounts) {
                    creditsAmounts[k].text = cText;
                    if(creditsAmounts[k].maxSizeResize)
                        creditsAmounts[k].maxSizeResize('width', maxWidth);
                }

                for (var k in balanceNumbers) {
                    balanceNumbers[k].text = bText;
                    if(balanceNumbers[k].maxSizeResize)
                        balanceNumbers[k].maxSizeResize('width', maxWidth);

                    balanceNumbers[k].clearColors();
                    balanceNumbers[k].addColor(currencyColor, bText.length - currency.length);
                }
            };

            //step 3 - jackpot popups
            //instantJackpotsPopupLogic
            var instantJackpotsPopupLogic = function(){
                var jackpotPopupPreload = function(state){
                    if(state !== 'play') { // adding instant jackpot assets to load in play state preload
                        var cbContainer = new nge.Mlm.Assets.Folder({name: 'jackpotPopupCustom', block:1});
                        mt.data.assets.contents.push(cbContainer);

                        cbContainer.contents = [
                            new nge.Mlm.Assets.Image({key: 'jackpotPopupCustomName1', block:1, fullPath: 'img/jackpots/names/popup_jackpot_1.png'}),
                            new nge.Mlm.Assets.Image({key: 'jackpotPopupCustomName2', block:1, fullPath: 'img/jackpots/names/popup_jackpot_2.png'}),
                            new nge.Mlm.Assets.Image({key: 'jackpotPopupCustomName3', block:1, fullPath: 'img/jackpots/names/popup_jackpot_3.png'}),
                            new nge.Mlm.Assets.Image({key: 'jackpotPopupCustomName4', block:1, fullPath: 'img/jackpots/names/popup_jackpot_4.png'})
                        ];

                        return;
                    }
                    
                    var antiCacheSuffix = nge.assets.getAntiCacheSuffix();
                    
                    // engine v2 loader can't add new assets to load if loadin in progress, so we need to load font after loading is finished  
                    if(nge.wrap && nge.wrap.load){
                        nge.wrap.load.font('jackpotsCustomFuturasbl', nge.realPathPrefix + 'css/fonts/jackpots/custom/futurasbl.otf' + antiCacheSuffix);
                        nge.wrap.load.start();
                    } else {
                        nge.game.load.font('jackpotsCustomFuturasbl', nge.realPathPrefix + 'css/fonts/jackpots/custom/futurasbl.otf' + antiCacheSuffix);
                        nge.game.load.onLoadComplete.addOnce(function(a){
                            var style = document.createElement('style');
                            style.type = 'text/css';
                            style.innerHTML = '@font-face {' +
                                'font-display: swap;' +
                                'font-family: \'' + 'jackpotsCustomFuturasbl' + '\';' +
                                'src: ' +
                                'url(\'' + nge.game.cache.getFont('jackpotsCustomFuturasbl') + '\') format(\'opentype\');' +
                                '}';
                            document.getElementsByTagName('head')[0].appendChild(style);
                            nge.Lib.Helper.isFontAvailable('jackpotsCustomFuturasbl');
                        });

                        nge.game.load.start();
                    }

                    nge.observer.remove('StatesManager.create.end', false, 'jackpotPopupPreload', true);
                };

                var showPopupTime = false;
                var popupIsShowing = false;
                var popupInitialY;
                var savedData = null;

                var spaceHandlerController = nge.App.getPath('Com.SpaceHandler.Controller', false, 'spaceHandler');

                if(spaceHandlerController) {
                    nge.App[nge.appNS].Com.SpaceHandler.Controller = spaceHandlerController.extend(function () {
                        this.extendDo = function () {
                            var superResult = this.super.extendDo();
                            return popupIsShowing || superResult;
                        };
                    });
                }

                var showPopup = function(){
                    if(!savedData)
                        return;

                    var type = savedData.jackpotIdx;
                    var amount = savedData.win;

                    savedData = null;

                    popupIsShowing = true;
                    var jackpotPopupContainer = nge.findOne('^jackpotPopupContainer');
                    var jackpotPopupInnerContainer = nge.findOne('^jackpotPopupInnerContainer');

                    if(typeof popupInitialY === 'undefined')
                        popupInitialY = jackpotPopupInnerContainer.y;

                    jackpotPopupInnerContainer.y = popupInitialY;

                    var newTween = (nge.tween) ? nge.tween.add.bind(nge.tween) : nge.game.add.tween.bind(nge.game.add);
                    var showPopupTween = newTween(jackpotPopupInnerContainer).from({y: -900}, 800);

                    showPopupTween.onStart.add(function(){
                        jackpotWinned = true;
                        jackpotPopupContainer.visible = true;
                        showPopupTween.target.visible = true;
                        // changed to absolute path (case when container has less parent nesting was fixed)
                        nge.game.world.bringToTop(jackpotPopupContainer.parent.parent);
                        showPopupTween.target.parent.parent.bringToTop(showPopupTween.target.parent);

                        // fix for Cloverstones and Book of Ra
                        var games = ['249', '3'];
                        if(games.indexOf(nge.gameCode) !== -1){
                            var pState = nge.findOne('^playState');
                            pState.parent.sendToBack(pState);
                        }

                        //nge.find('^logoJackpotPopup').visible = false;
                        var logoJackpotPopup = nge.find('^logoJackpotPopup');
                        logoJackpotPopup.y = 165;
                        logoJackpotPopup.scale.x = logoJackpotPopup.scale.y = 1.15;

                        //todo insert TEXT
                        var currency = nge.localData.get('balance.currency');
                        var totalTextWin = amount + ' ' + currency;

                        if(!nge.findOne('^jackpotPopupInstantWinText')){
                            nge.objects.create(
                                {
                                    type: mt.objects.Image,
                                    name: 'jackpotPopupInstantWinType',
                                    assetKey: 'jackpotPopupCustomName' + type,
                                    x: 0,
                                    y: 75,
                                    anchorX: 0.5,
                                    anchorY: 0.5
                                },
                                nge.find('^logoJackpotPopup').parent
                            );

                            // there is no mt.objects.TEXT in some old games
                            var textType = (mt.objects && mt.objects.TEXT) ? mt.objects.TEXT : mt.TEXT;

                            nge.objects.create(
                                {
                                    type: textType,
                                    name: 'jackpotPopupInstantWinText',
                                    x: 0,
                                    y: 0,
                                    style: {
                                        font: '51pt jackpotsCustomFuturasbl',
                                        fill: '#fcd664',
                                        shadowColor: '#64401c',
                                        shadowOffsetY: 3,
                                        stroke: '#8a522a',
                                        strokeThickness: 1
                                    },
                                    anchorX: 0.5,
                                    anchorY: 0.5,
                                    text: '',
                                    size: 215
                                },
                                nge.find('^logoJackpotPopup').parent
                            );
                        }

                        var textWin = nge.findOne('^jackpotPopupInstantWinText');
                        textWin.text = totalTextWin;


                        var engineVersion = (typeof Phaser !== 'undefined' && typeof Phaser.VERSION !== 'undefined') ? 1 : 2;
                        var mainSprite;

                        //close callback
                        var jackpotClose = function(){
                            if(!showPopupTime)
                                return false;

                            var closeWaitTime = 1000; //1sec

                            if((nge.Lib.Time.get() - showPopupTime) < closeWaitTime)
                                return false;

                            showPopupTime = false;

                            var hidePopupTween = newTween(jackpotPopupInnerContainer).to({alpha: 0.3}, 400);

                            hidePopupTween.onComplete.add(function(){
                                jackpotPopupContainer.visible = false;
                                hidePopupTween.target.visible = true;
                                hidePopupTween.target.alpha = 1;

                                nge.findOne('^jackpotPopupInstantWinType').destroy();
                                nge.findOne('^jackpotPopupInstantWinText').destroy();

                                popupIsShowing = false;

                                updateBalance();


                                var statusContainer = nge.findOne('^jackpotStatusContainer');
                                
                                // carefully check 
                                if(statusContainer && statusContainer.parent && statusContainer.parent.getData && statusContainer.parent.parent){
                                    // if jackpot status panel is child of component container than we need to move it to the top
                                    if(statusContainer.parent.getData().name === 'jackpotStatusPanelCom')
                                        statusContainer.parent.parent.bringToTop(statusContainer.parent);
                                }
                            });
                            // clear events if first engine
                            if(mainSprite.events)
                                mainSprite.events.onInputDown.removeAll();

                            hidePopupTween.start();
                        };

                        //close handler
                        if(engineVersion === 1){
                            mainSprite = nge.findAll('^jackpotPopup').find(function(el){return el instanceof Phaser.Sprite});
                            mainSprite.inputEnabled = true;
                            mainSprite.input.enabled = true;
                            mainSprite.input.useHandCursor = true;
                            mainSprite.events.onInputDown.add(jackpotClose);
                        }else if(engineVersion === 2){
                            mainSprite = nge.findOne('^jackpotPopup');
                            mainSprite.interactive = true;
                            mainSprite.buttonMode = true;
                            mainSprite.tap = jackpotClose;
                            mainSprite.click = jackpotClose;
                        }
                        //nge.observer.fire('jackpot.startPopup.show'); //sound
                    });

                    showPopupTween.onComplete.add(function(){
                        nge.observer.fire('jackpot.win'); //sound
                        showPopupTime = nge.Lib.Time.get();
                    });

                    showPopupTween.start();
                };

                nge.observer.add('coins.change', updateBalance, 'jackpotUpdateBalance', true);
                nge.observer.add('StatesManager.create.end', jackpotPopupPreload, 'jackpotPopupPreload', true);
                nge.observer.add('StatesManager.create.end', function(state){
                    if(state === 'play' && savedData)
                        showPopup();
                }, false, true);
 
                if(nge.Lib.Helper.mobileAndTabletCheck() && !nge.App.DjGameBase && !nge.App.RiverGameBase){
                    nge.observer.add('autospinSimple.on', function(){
                        if(jackpotWinned)
                            nge.observer.fire('gamble.take');
                    }, false, true);
                    nge.observer.add('slotMachine.spinStart', function(){
                        jackpotWinned = false;
                    }, false, true);
                }

                nge.observer.add('transportMessage.JackpotPlayResponse',
                    function (data) {
                        if(!instantJackpotsMode)
                            return false;

                        //turn off Autospins
                        nge.observer.fire('autospinSimple.off');
                        nge.observer.fire('autospin.off');

                        savedData = data.data;

                        if(nge.statesManager.getCurrentName() === 'play')
                            showPopup(); //show popup
                    },
                    false,
                    true
                );

            };
        }
    },
    sweepsStakes:{
        1: function(){
            var delayForLockedCalls = 500;
            var sweepsStakesMode = false;

            var modes = (nge.App.getSysInstancesModes) ? nge.App.getSysInstancesModes() : nge.localData.get('_sysInstancesModes') || [];
            var mode = 'Gold';
            var color = 'gold';
            if(modes.indexOf('blue') !== -1) {
                mode = 'Blue';
                color = 'blue';
            } else if(modes.indexOf('silver') !== -1) {
                mode = 'Silver';
                color = 'silver';
            }

            //step 1 - supported SweepStakes in AuthRequest
            //var features = nge.App.getInstance('Mlm.Brain.FeaturesCfg');
            var FeaturesClass = nge.App.getPath('Mlm.Brain.FeaturesCfg', false, 'sweepsStakes');
            var features = new FeaturesClass();
            features.supported.push('SweepStakes');

            nge.Lib.Helper.recursiveSet(
                'App.' + nge.appNS + '.Mlm.Brain.FeaturesCfg',
                Class.extend(function () {
                    this.singleton = true;
                    this.required = features.required;
                    this.supported = features.supported;
                }),
                nge
            );

            //step 2 - check gameModes and search for SweepStakes
            var authResponseModelHardcode = function(d) {
                return {
                    action: 'AuthResponse',
                    result: nge.Lib.Helper.recursiveGet('result', d, !1),
                    sesId: nge.Lib.Helper.recursiveGet('sesId', d, !1),
                    data: {
                        betMultiplier: nge.Lib.Helper.recursiveGet('data.betMultiplier', d, false),
                        snivy: nge.Lib.Helper.recursiveGet('data.snivy', d, !1),
                        sessionId: nge.Lib.Helper.recursiveGet('data.sessionId', d, !1),
                        bets: nge.Lib.Helper.recursiveGet('data.bets', d, []),
                        extraBet: nge.Lib.Helper.recursiveGet('data.extraBet', d, 0),
                        coinValues: nge.Lib.Helper.recursiveGet('data.coinValues', d, []),
                        defaultCoinValue: nge.Lib.Helper.recursiveGet('data.defaultCoinValue', d, 1),
                        defaultBet: nge.Lib.Helper.recursiveGet('data.defaultBet', d, !1),
                        defaultLines: nge.Lib.Helper.recursiveGet('data.defaultLines', d, []),
                        gameModes: nge.Lib.Helper.recursiveGet('data.gameModes', d, 0),
                        gameParameters: {
                            availableLines: nge.Lib.Helper.recursiveGet('data.gameParameters.availableLines', d, []),
                            payouts: nge.Lib.Helper.recursiveGet('data.gameParameters.payouts', d, []),
                            initialSymbols: nge.Lib.Helper.recursiveGet('data.gameParameters.initialSymbols', d, []),
                            rtp: nge.Lib.Helper.recursiveGet('data.gameParameters.rtp', d, false)
                        },
                        supportedFeatures: nge.Lib.Helper.recursiveGet('data.gameParameters.supportedFeatures', d, []),
                        jackpotsEnabled: nge.Lib.Helper.recursiveGet('data.jackpotsEnabled', d, !1),
                        noChance: {
                            nextWin: nge.Lib.Helper.recursiveGet('data.noChance.nextWin', d, 0),
                            nextRows: nge.Lib.Helper.recursiveGet('data.noChance.nextRows', d, [])
                        },
                        restoredGameCode: nge.Lib.Helper.recursiveGet('data.restoredGameCode', d, !1),
                        lastResponse: nge.Lib.Helper.recursiveGet('data.lastResponse', d, !1),
                        actions: nge.Lib.Helper.recursiveGet('data.actions', d, []),
                        errorCode: nge.Lib.Helper.recursiveGet('data.errorCode', d, !1),
                        description: nge.Lib.Helper.recursiveGet('data.description', d, !1)
                    }
                };
            };

            var AuthResponseModelPath = nge.App.getPath('Mlm.Transport.Models.AuthResponse', false, 'instantJackpots');
            var testInstance = new AuthResponseModelPath();
            var authResponseModel = authResponseModelHardcode;

            if(testInstance.customConstructor){
                authResponseModel = AuthResponseModelPath.extend(function () {
                    this.customConstructor = function (options) {
                        this.super.customConstructor(options);
                        const gameModes = nge.Lib.Helper.recursiveGet('data.gameModes', options, 0);
                        this.data.gameModes = gameModes;
                    };
                });
            }


            nge.Lib.Helper.recursiveSet(
                'App.' + nge.appNS + '.Mlm.Transport.Models.AuthResponse',
                authResponseModel,
                nge
            );
            nge.observer.add('transportMessage.AuthResponse',
                function (data) {
                    if(sweepsStakesMode)
                        return true;

                    var aData = data.data;

                    if (aData.gameModes && aData.gameModes.indexOf('SweepStakes') !== -1) {
                        sweepsStakesMode = true;
                        log('SweepStakes mode');
                        //SweepStakes mode
                        sweepsTransport();
                        sweepsBalance();
                        cashSweepsStakesPopup();
                        //nge.App[nge.appNS].Com.CurrencySwitcher.Controller = Class.extend(function () {}); //no CurrencySwitcher !!!
                    }

                    nge.localData.set('sweepStakes.enabled', sweepsStakesMode);
                },
                false,
                true
            );

            //step 3 - balanceResponse handler and save entries correctly
            var sweepsTransport = function() {
                nge.Lib.Helper.recursiveSet(
                    'App.' + nge.appNS + '.Mlm.Transport.Models.BalanceResponse',
                    function(d) {
                        return {
                            action: 'BalanceResponse',
                            result: nge.Lib.Helper.recursiveGet('result', d, !1),
                            sesId: nge.Lib.Helper.recursiveGet('sesId', d, !1),
                            data: {
                                totalAmount: nge.Lib.Helper.recursiveGet('data.totalAmount', d, 0),
                                currency: nge.Lib.Helper.recursiveGet('data.currency', d, 'FUN'),
                                entries: nge.Lib.Helper.recursiveGet('data.entries', d, 0)
                            }
                        };
                    },
                    nge
                );
                nge.observer.add(
                    'transportMessage.BalanceResponse',
                    function (data) {
                        var bData = data.data;
                        bData._original = nge.Lib.Helper.jsObjClone(bData);
                        bData.totalAmount = bData.entries;
                        bData.totalAmountReal = bData._original.totalAmount;
                        nge.localData.set('balance', bData);
                        nge.observer.fire('entries.amount', data.data);
                    },
                    false,
                    true
                );
            };


            //step 4 - make double balance
            var sweepsBalance = function(){
                var textCheck = function(){
                    nge.Common.Lib.Helper.objectClone('.balanceNumber', '.balanceNumberClone');
                    nge.Common.Lib.Helper.objectClone('.creditsNumber', '.creditsNumberClone');
                    nge.Common.Lib.Helper.objectClone('.creditsTotalBetNumber', '.creditsTotalBetNumberClone');
                    nge.Common.Lib.Helper.objectClone('.winNumber', '.winNumberClone');
                    nge.Common.Lib.Helper.objectClone('.creditsWinNumber', '.creditsWinNumberClone');
                };

                var balanceUpdateHandler = nge.Common.Lib.Helper.infrequentHandler(function(d){balanceToSweeps(d); }, delayForLockedCalls);

                var balanceToSweeps = function (bData) {
                    textCheck();

                    if(!nge.localData.get('coins.value'))
                        nge.localData.set(nge.localData.get('coins.defaultCoin'));
                    
                    var data = nge.Lib.Helper.jsObjClone(nge.localData.get('balance'));

                    if(bData && bData.totalAmount)
                        data.totalAmount = bData.totalAmount;

                    if(bData && bData.totalAmountReal)
                        data.totalAmountReal = bData.totalAmountReal;

                    //com balance
                    var balanceNumbers = nge.findAll('.balanceNumberClone');
                    var creditsAmounts = nge.findAll('.creditsNumberClone');
                    var i = 0,
                        bcNumbers = [];
                        
                    if(balanceNumbers)
                        for(i = 0; i < balanceNumbers.length; i++)
                            bcNumbers.push(balanceNumbers[i]);

                    if(creditsAmounts)
                        for(i = 0; i < creditsAmounts.length; i++)
                            bcNumbers.push(creditsAmounts[i]);

                    var currency = data.currency || nge.localData.get('balance.currency');
                    var text = nge.Lib.Money.toCoinsInt(data.totalAmount) +
                        ' / ' +
                        parseFloat(data.totalAmountReal).toFixed(2) +
                        ' ' + currency;

                    var maxWidth = false;
                    var currencyColor = false;

                    var balanceComOriginal = nge.App.getInstance('Com.Balance.Controller');
                    if(balanceComOriginal && balanceComOriginal.maxWidth)
                        maxWidth = balanceComOriginal.maxWidth;
                    if(balanceComOriginal && balanceComOriginal.currencyColor)
                        currencyColor = balanceComOriginal.currencyColor;
                    if (nge.localData.get('uiType') === 'gold') { //if in game no ui_v3 instance modes
                        currencyColor = '#EFC273';
                    } else if (nge.localData.get('uiType') === 'blue') {
                        currencyColor = '#CAEAFF';
                    } else if (nge.localData.get('uiType') === 'silver') {
                        currencyColor = '#DDDDDD';
                    }

                    for (var k in bcNumbers) {
                        (function(balanceNumber, bText){
                            var setBalanceNumber = function(){
                                balanceNumber.text = bText;

                                if(bText && maxWidth && balanceNumber.maxSizeResize)
                                    balanceNumber.maxSizeResize('width', maxWidth);

                                if(currencyColor){
                                    balanceNumber.clearColors();
                                    balanceNumber.addColor(currencyColor, bText.length - currency.length);
                                }
                            };

                            setBalanceNumber();
                            //setTimeout(setBalanceNumber, 2);
                            //setTimeout(setBalanceNumber, 50);
                        })(bcNumbers[k], text);
                    }

                    nge.observer.fire('entries.amount.change', data.totalAmountReal);
                };


                var winFieldUpdateHandler = nge.Common.Lib.Helper.infrequentHandler(function(d){setWinFieldValue(d); }, delayForLockedCalls);

                var setWinFieldValue = function(value) {
                    textCheck();

                    var winNumbers = nge.findAll('.winNumberClone');
                    if(!winNumbers)
                        winNumbers = [];
                    var winNumbersCredits = nge.findAll('.creditsWinNumberClone');
                    if(!winNumbersCredits)
                        winNumbersCredits = [];
                    var allWinNumbers = winNumbers.concat(winNumbersCredits);
                    var cfg = nge.App.getInstance('Com.WinField.Cfg').get();
                    var wonWinText = cfg.wonWinText ? cfg.wonWinText : 'GOOD LUCK'; //in some games there is no cfg.wonWinText
                    var newText;
                    if(value && typeof value === 'number') {
                        newText = value;
                    } else {
                        newText = typeof value === 'undefined' || !value ? nge.i18n.get(wonWinText) : nge.i18n.get(value);
                    }

                    for(var i = 0; i < allWinNumbers.length; i++){
                        if(typeof newText !== 'undefined' && newText.toString)
                            allWinNumbers[i].text = newText;
                    }
                };
                
                var isMobileOrTablet = nge.Lib.Helper.mobileAndTabletCheck();
                var path = isMobileOrTablet ? 'Com.WinField.Mobile.Controller' : 'Com.WinField.Controller';
                var winFieldController = nge.App.getPath(path, false, 'sweepsBalanceWinField');
                if(winFieldController) {
                    nge.Lib.Helper.recursiveSet(
                        'App.' + nge.appNS + '.' + path,
                        winFieldController.extend(function () {
                            this.setText = function (text, duration, effect) {
                                setWinFieldValue(text);
                            };
                        }),
                        nge
                    );
                }

                var currentDjRiverBalance = null;
                var buyTimeResponseReceived = false;
                var showBalanceInDjRiverGames = function () {
                    var balance = nge.Lib.Helper.jsObjClone(nge.localData.get('balance'));
                    if(balance) {
                        if (balance.totalAmount !== balance.entries) {
                            balance.totalAmount = balance.entries;
                        }
                        balanceToSweeps(balance);
                        currentDjRiverBalance = balance;
                    }
                };
                var entriesAmountInDjRiverGames = function (data) {
                    if(!currentDjRiverBalance) {
                        currentDjRiverBalance =  nge.Lib.Helper.jsObjClone(data);
                    }
                    currentDjRiverBalance.currency = data.currency;
                    currentDjRiverBalance.entries = data.entries;
                    currentDjRiverBalance.totalAmount = data.totalAmount;
                    if(buyTimeResponseReceived) {
                        currentDjRiverBalance.totalAmountReal = data.totalAmountReal;
                        buyTimeResponseReceived = false;
                    }
                    balanceUpdateHandler(currentDjRiverBalance);
                };
                var balanceAmountInDjRiverGames = function (data) {
                    if(data && !data.entries)
                        balanceUpdateHandler(data);
                };
                
                //it is not necessary in prototypes and riverGames on packages
                if(!nge.App.DjGameBase && !nge.App.RiverGameBase) {
                    nge.observer.add('win.winField.setValue', winFieldUpdateHandler, false, true);
                    nge.observer.add('win.printMessage', winFieldUpdateHandler, false, true);
                    nge.observer.add('game.readyToPlay', winFieldUpdateHandler, false, true);
                    nge.observer.add('game.readyToPlay', balanceUpdateHandler, false, true);
                    nge.observer.add('entries.amount', balanceUpdateHandler, false, true);
                    nge.observer.add('balance.amount', balanceUpdateHandler, false, true);
                    nge.observer.add('win', balanceUpdateHandler, false, true);
                }
              
                if(nge.App.RiverGameBase) {
                    nge.observer.add('win.winField.setValue', winFieldUpdateHandler, false, true);
                    nge.observer.add('win.printMessage', winFieldUpdateHandler, false, true);
                    nge.observer.add('game.readyToPlay', winFieldUpdateHandler, false, true);
                    nge.observer.add('jackpot.forceClose', function() { currentDjRiverBalance = null; }, false, true);

                    var subscribesForSlowBalance = function () {//Thunder Strike

                        nge.observer.add('StatesManager.create.end', function(state) {
                            var gamesList = ['121', '146', '235', '254', '256'];
                            if(state === 'play' && gamesList.indexOf(nge.gameCode) !== -1)
                                balanceUpdateHandler();
                        });

                        nge.observer.add('entries.amount', balanceUpdateHandler, 'entriesAmountOldPrototypes', true);
                        nge.observer.add('balance.amount', balanceUpdateHandler, 'balanceAmountOldPrototypes', true);
                        nge.observer.add('win', balanceUpdateHandler, 'winOldPrototypes', true);
                    };

                    var subscribesForFastBalance = function () {//Cleos Heart, wolf reels
                        nge.observer.add('entries.amount', entriesAmountInDjRiverGames, 'entriesAmountDjRiverGames', true);
                        nge.observer.add('balance.amount', balanceAmountInDjRiverGames, 'balanceAmountDjRiverGames', true);
                        nge.observer.add('transportMessage.BuyTimeResponse', function() {
                            buyTimeResponseReceived = true;
                        }, 'buyTimeNewPrototypes', true);
                        nge.observer.add('Transport.close', function() {
                            buyTimeResponseReceived = false;
                            currentDjRiverBalance = null;
                        }, 'transportCloseNewPrototypes', true);
                    };

                    var isMobileOrTablet = nge.Lib.Helper.mobileAndTabletCheck();
                  
                    // DIRTY HACK FOR GAMES WHERE NEED TO HAVE EXACT PATH TO CONTROLLER
                    var gameCodes = ['171', '121'];
                    var addition = gameCodes.indexOf(nge.Cfg.Main.gameCode) !== -1 ? '.' + mode : '';

                    var _lowerModes = nge.App.getSysInstancesModes().map(function(upperMode){
                        return upperMode.toLowerCase();
                    });
                    var _lowerMode = mode.toLowerCase();

                    var modePath = (_lowerModes.indexOf(_lowerMode) !== -1) ? '.' + mode : '';
                    var path = isMobileOrTablet ? 'Com.Balance.Mobile' + addition + '.Controller' : 'Com.Balance.UI_v3' + modePath + '.Controller';
                    var balanceController = nge.App.getPath(path, false, 'sweepsBalanceField');
                    if(balanceController) {
                        nge.Lib.Helper.recursiveSet(
                            'App.' + nge.appNS + '.' + path ,
                            balanceController.extend(function () {
                                if(['257', '258'].indexOf(nge.gameCode) !== -1)
                                    this.currencyColor = '#EFC273';

                                if(this.updateText) {
                                    this.updateText = function () {
                                        showBalanceInDjRiverGames();
                                    };
                                    subscribesForFastBalance();
                                } else {
                                    subscribesForSlowBalance();
                                }
                            }),
                            nge
                        );
                    }
                }

                if(nge.App.DjGameBase){
                    //need in HitInVegas and ChiliPepper
                    if (typeof Phaser !== 'undefined' && typeof Phaser.VERSION !== 'undefined') {
                        nge.observer.add('entries.amount', balanceUpdateHandler, 'entriesAmountOldPrototypes', true);
                        nge.observer.add('balance.amount', balanceUpdateHandler, 'balanceAmountOldPrototypes', true);
                        nge.observer.add('win', balanceUpdateHandler, 'winOldPrototypes', true);
                        nge.observer.add('StatesManager.create.end', function(state) {
                            var gamesList = ['176', '247'];
                            if(state === 'play' && gamesList.indexOf(nge.gameCode) !== -1)
                                balanceUpdateHandler();
                        }, 'createEndPrototypes', true);
                    } else {
                        nge.observer.add('StatesManager.create.end', function(state) {
                            if(state === 'jackpot')
                                currentDjRiverBalance = null;
                        }, 'statesCreateDj', true);

                        nge.observer.add('entries.amount', entriesAmountInDjRiverGames, 'entriesAmountDjRiverGames', true);
                        nge.observer.add('balance.amount', balanceAmountInDjRiverGames, 'balanceAmountDjRiverGames', true);
                        nge.observer.add('transportMessage.BuyTimeResponse', function() {
                            buyTimeResponseReceived = true;
                        }, 'buyTimeNewPrototypes', true);
                        nge.observer.add('Transport.close', function() {
                            buyTimeResponseReceived = false;
                            currentDjRiverBalance = null;
                        }, 'transportCloseNewPrototypes', true);

                        var isMobileOrTablet = nge.Lib.Helper.mobileAndTabletCheck();
                        var path = isMobileOrTablet ? 'Com.Balance.Mobile.Controller' : 'Com.Balance.Controller';

                        var balanceController = nge.App.getPath(path, false, 'sweepsBalanceField');
                        if(balanceController) {
                            nge.Lib.Helper.recursiveSet(
                                'App.' + nge.appNS + '.' + path,
                                balanceController.extend(function () {
                                    this.drawText = function (data) {
                                        showBalanceInDjRiverGames();
                                    };
                                }),
                                nge
                            );
                        }
                    }
                }

                function moveWinUpOnFreespins() {
                    var resetted = true;
                    var deltaY = -16;
    
                    function addDelta(delta) {
                        var winNumber = nge.findOne('.winNumberClone');
                        if(winNumber)
                            winNumber.y += delta;
    
                        var winNumberCredits = nge.findOne('.creditsWinNumberClone');
                        if(winNumberCredits)
                            winNumberCredits.y += delta;  
                    }
    
                    function updateCounter(){
                        if(!resetted)
                            return;
    
                        addDelta(deltaY);
    
                        resetted = false;
                    }
    
                    function resetCounter(){
                        if(resetted)
                            return;
    
                        addDelta(-deltaY);
    
                        resetted = true;
                    }
    
                    function statesCreate(state){
                        if(state !== 'play')
                            return;
    
                        resetted = true;
                    }

                    nge.observer.add('coins.change', balanceUpdateHandler, false, true);
                    nge.observer.add('game.readyToPlay', balanceUpdateHandler, false, true);
    
                    nge.observer.add('StatesManager.create.end', statesCreate, 'statesCreate', true);
                    nge.observer.add('freespin.counterUpdate', updateCounter, false, true);
                    nge.observer.add('freespin.counterReset', resetCounter, false, true);
                }

                var games = ['176', '235', '171', '190', '247'];
                
                if(nge.Lib.Helper.mobileAndTabletCheck() && games.indexOf(nge.Cfg.Main.gameCode) !== -1)
                    moveWinUpOnFreespins();
            };

            //step 5 - cash button must be with BuyTime logic
            //css loading
            var cashSweepsStakesPopup = function(){
                var popupDom;
                var htData = '';
                var mobile = nge.Lib.Helper.mobileAndTabletCheck();
                var _takingInProgress = false;
                var _buyTimeResponseWaiting = false;

                $.get('../../tpl/sweepstakes/buytime-' + color + '.html', function (hData) {
                    var css = hData.split('<style>').pop().split('</style>')[0];
                    htData = hData.split('<body>').pop().split('</body>')[0];

                    $('<style type="text/css">' + css + '</style>').appendTo($('head'));
                });

                var cashClickHandler = function() {
                    var lastState = nge.localData.get('slotMachine.lastResponse.state');
                    // checking if wasn't restored any bonus
                    var isBonusState = lastState && lastState !== 'Ready';
                    var auto = nge.localData.get('autospin');
                    var spinning = nge.localData.get('slotMachineSpinning');
                    var jackpotCanPlay = nge.localData.get('jackpot.canPlay');
                    var cState = nge.statesManager.getCurrentName()
                    var freespinInProgress = nge.localData.get('freespin.inProgress');

                    if(auto || spinning || _takingInProgress || isBonusState || jackpotCanPlay || cState !== 'play' || freespinInProgress)
                        return false;

                    nge.localData.set('spaceHandler.isEnable', false); // turn off spacebar
                    nge.localData.set('paytable.showed', true); // for some River games
                    resetBuyTimeResponseWaiting();

                    popupDom = $('<div class="cash-sweeps-stakes-popup">' + htData + '</div>');

                    // need wait one frame for button logic comlplete
                    nge.rafSetTimeout(function(){
                        $('body').append(popupDom);
                        $('.app-button.modal__close-btn').click(closePopup);
                        $('.app-button').click(sendPopup);
                        processCashPopupValues();
                        windowResizeHandler();
                    }, 1);
                };

                var sendPopup = function (e) {
                    if (_buyTimeResponseWaiting)
                        return;

                    var amount = $(e.currentTarget).data('value');

                    // preventing spacebar buying
                    e.currentTarget.blur();

                    if(!amount)
                        return false;

                    if(amount === 'all')
                        amount = 0; //amount:0 if buyAll

                    if(!nge.Mlm.Transport.Models.BuyTimeRequest) {
                        nge.Mlm.Transport.Models.BuyTimeRequest = function(d) {
                            return {
                                action: 'BuyTimeRequest',
                                result: nge.Lib.Helper.recursiveGet('result', d, !1),
                                sesId: nge.Lib.Helper.recursiveGet('sesId', d, !1),
                                data: {
                                    amount: nge.Lib.Helper.recursiveGet('data.amount', d, false)
                                }
                            };
                        };
                    }

                    if(!nge.Mlm.Transport.Models.BuyTimeResponse) {
                        nge.Mlm.Transport.Models.BuyTimeResponse = function(d) {
                            return {
                                action: 'BuyTimeResponse',
                                result: nge.Lib.Helper.recursiveGet('result', d, !1),
                                sesId: nge.Lib.Helper.recursiveGet('sesId', d, !1),
                                data: {
                                    entries: nge.Lib.Helper.recursiveGet('data.entries', d, false),
                                    totalAmount: nge.Lib.Helper.recursiveGet('data.totalAmount', d, false),
                                    currency: nge.Lib.Helper.recursiveGet('data.currency', d, false)
                                }
                            };
                        };
                    }


                    var mm = nge.App.getInstance('Mlm.Transport.Models.BuyTimeRequest', false, {
                        'result': true,
                        'data': {
                            'amount': amount
                        }
                    });
                    nge.transport.send(mm);
                    _buyTimeResponseWaiting = true;

                    processCashPopupValues(0);

                    //closePopup();  deprecated;
                    return true;
                };

                var closePopup = function () {
                    nge.localData.set('spaceHandler.isEnable', true); // turn on space bar
                    nge.localData.set('paytable.showed', false); // for some River games

                    popupDom && popupDom.remove();
                    popupDom = false;
                    return true;
                };

                var cashPreload = function(state){
                    if(mobile)
                        return false;

                    var cashButtonPath = 'img/buytime/btn_ui_buy_' + color + '.png';

                    //nge.wrap.load.addSpritesheet('cashButtonBaseAsset', cashButtonPath, 168, 80);
                    var cbContainer = new nge.Mlm.Assets.Folder({name: 'cashButton', block:1});
                    mt.data.assets.contents.push(cbContainer);

                    cbContainer.contents = [new nge.Mlm.Assets.Image({
                        key: 'cashButtonBaseAsset',
                        fullPath: cashButtonPath,
                        frameWidth: 168,
                        frameHeight: 80,
                        block:1
                    })];

                    nge.observer.remove('StatesManager.create.end', false, 'cashPreload', true);
                };

                var cashCreate = function(state){
                    if(state !== 'play' && state !== 'pickBonus' && state !== 'bonusWheel')
                        return false;

                    var blockBuyTimeButton = nge.Lib.Helper.parseGetParams('blockBuyTimeButton');

                    if(blockBuyTimeButton)
                        return false;

                    var buttonContainer = nge.findOne('^UIBottomPanelsContainer') ||
                        nge.findOne('^bottomUIContainer') ||
                        nge.findOne('^winBottomlUIMobileContainer') ||
                        nge.findOne('^playState');

                    if(mobile){
                        var textStyleMobile = {
                            font: '33pt futuraptheavy',
                            fill: '#fec36d',
                            align: 'center'
                        };

                        var x = 1650;
                        var y = 650;
                        var textX = 88;
                        var textY = 88;

                        if(color === 'blue'){
                            textStyleMobile.fill = '#bfecff';
                        }else if(color === 'silver'){
                            textStyleMobile.fill = '#dcdcdc';
                        } else if (nge.gameCode === '216') { // Diamond Shot
                            textStyleMobile.fill = '#112c77';
                            x = 1654;
                            y = 638;
                            textX = 84;
                            textY = 97;
                        } else if (nge.gameCode === '290') { // Volcano Fruits
                            textStyleMobile.fill = '#ffffff';
                            x = 1683;
                            y = 640;
                            textX = 91;
                        } else if (nge.gameCode === '261') { // Fruits Fury
                            textStyleMobile.fill = '#ffffff';
                            x = 1702;
                            y = 640;
                        }

                        // get assetKey
                        var autoAssetKeys = ['autoSpinButtonMobileButton_button', 'autoSpinButtonMobile'];
                        var assetKey = '';
                        for (var i = 0; i < autoAssetKeys.length; i++) {
                            if(nge.game.cache.checkImageKey(autoAssetKeys[i])){
                                assetKey = autoAssetKeys[i];
                                break;
                            }
                        }

                        var btnContainer = nge.objects.create(
                            new nge.Mlm.Objects.Folder({
                                x: x,
                                y: y,
                                name: 'buyTimeButtonContainer',
                                contents:[
                                    new nge.Mlm.Objects.Text({
                                        x: textX,
                                        y: textY,
                                        text: 'BUY',
                                        font: '32pt futuraptheavy',
                                        anchorX: 0.5,
                                        anchorY: 0.5,
                                        style: textStyleMobile
                                    }),
                                    new nge.Mlm.Objects.Button({
                                        assetKey: assetKey,
                                        pixelPerfectClick: false,
                                        btnFrames: {
                                            'over': 0,
                                            'out': 0,
                                            'down': 0
                                        },
                                        frame: 0,
                                        action: cashClickHandler
                                    })
                                ]
                            }), buttonContainer);
                            
                            // for Diamond Shot mobile spin button has custom long sprite
                            // need move cash button on top of spin button
                            if(nge.Cfg.Main.gameCode === '216'){
                                btnContainer.parent.parent.parent.bringToTop(btnContainer.parent.parent);

                                // fix for mobile freespin amount texts;
                                var c = nge.findOne('^gameFreeSpinMobileContainer');
                                if(c && c.parent)
                                    c.parent.bringToTop(c);
                            }
                    }else{
                        var textStyle = {
                            font: '20pt futuraptheavy',
                            fill: '#230204',
                            stroke: '#d99c40',
                            strokeThickness: 2,
                            align: 'center'
                        };

                        if(color === 'blue'){
                            textStyle.fill = '#101f2f';
                            textStyle.stroke = '#4383ba';
                        }else if(color === 'silver'){
                            textStyle.fill = '#000000';
                            textStyle.stroke = '#787878';
                        }

                        var x = 240;
                        var y = 970;
                        var universalUI = false;

                        if(nge.gameCode === '176'){
                            y = 984;
                        }

                        if(nge.findOne('^UIBottomPanelsContainer')) {
                            var uiContainer = nge.findOne('^UICointainer');
                            if(uiContainer && uiContainer.x !== 0 && uiContainer.y !== 0) {
                                var coinValueContainer = nge.findOne('^coinValueContainer');
                                if(coinValueContainer) {
                                    x = coinValueContainer.x;
                                    y = coinValueContainer.y;
                                    universalUI = true;
                                }
                            }
                        }
                        var buyTimeButton = nge.objects.create(
                            new nge.Mlm.Objects.Folder({
                                x: x,
                                y: y,
                                name: 'buyTimeButtonContainer',
                                contents:[
                                    new nge.Mlm.Objects.Text({
                                        x: universalUI ? 0 : 80,
                                        y: universalUI ? 0 : 40,
                                        text: 'BUY TIME',
                                        anchorX: 0.5,
                                        anchorY: 0.5,
                                        style: textStyle
                                    }),
                                    new nge.Mlm.Objects.Button({
                                        assetKey: 'cashButtonBaseAsset',
                                        anchorX: universalUI ? 0.5 : 0,
                                        anchorY: universalUI ? 0.5 : 0,
                                        btnFrames: {
                                            'over': 2,
                                            'out': 1,
                                            'down': 0
                                        },
                                        frame: 1,
                                        action: cashClickHandler
                                    })
                                ]
                            }), buttonContainer);

                        if(state === 'pickBonus' || state === 'bonusWheel') {
                            if(!nge.find('^coinValueContainer')) {
                                buyTimeButton.visible = false;
                            }
                        }
                    }

                    cashButtonLogic();

                    nge.find('^coinValueText').visible = false;
                    nge.find('^coinValueContainer').visible = false;
                };

                var processCashPopupValues = function(totalAmountReal){
                    if(typeof totalAmountReal !== 'number')
                        totalAmountReal = nge.localData.get('balance').totalAmountReal;

                    $('.app-button').each(function() {
                        $( this ).removeClass('app-button_disabled');

                        if(
                            ($(this).data('value') === 'all' && +totalAmountReal <= 0) ||
                            ($(this).data('value') && +$(this).data('value') > ~~totalAmountReal)
                        )
                            $(this).addClass('app-button_disabled');
                    });
                };

                var buyTimeResponseHandler = function() {
                    //get balance
                    nge.observer.fire('balanceRequest');
                };

                var resetBuyTimeResponseWaiting = function() {
                    _buyTimeResponseWaiting = false;
                };

                var windowResizeHandler = function(){
                    if(!popupDom)
                        return false;
                    var canvasStyle = $('canvas')[0].style;

                    //$('.cash-sweeps-stakes-popup').css('width', canvasStyle.width);
                    $('.cash-sweeps-stakes-popup').css('font-size', canvasStyle.height);
                };

                var _cashButtonLogicSetupped = false;

                var cashButtonLogic = function(){
                    if(_cashButtonLogicSetupped)
                        return false;

                    //visibility logic
                    if(!mobile) //no logic for desktop
                        return false;

                    var impEvents = [
                        'slotMachine.spinCommand',
                        'slotMachine.spinRequest',
                        'transportMessage.BalanceResponse',
                        'autospinSimple.off',
                        'autospinSimple.on',
                        'spinReadyToProceed',
                        'buttons.restore',
                        'spinAndWinComplete'
                    ];

                    var _checkShow = function(){
                        var btn = nge.findOne('^buyTimeButtonContainer');

                        if(!btn)
                            return false;

                        var lastState = nge.localData.get('slotMachine.lastResponse.state');
                        // checking if wasn't restored any bonus
                        var isBonusState = lastState && lastState !== 'Ready';
                        var auto = nge.localData.get('autospin');
                        var spinning = nge.localData.get('slotMachineSpinning');
                        var canGamble = nge.localData.get('gamble.canPlay');

                        btn.visible = !auto && !spinning && !_takingInProgress && !isBonusState && !canGamble;
                    };

                    // need call at least once to set visibility if bonus was restored
                    _checkShow();
                    nge.observer.add('StatesManager.create.end', _checkShow, '_checkShowBuyTimeButton', true);

                    for(var i = 0; i < impEvents.length; i++)
                        nge.observer.add(impEvents[i], _checkShow, false, true);

                    _cashButtonLogicSetupped = true;
                };

                var spinResponceHandler = function(){
                    _takingInProgress = true;
                };
                var balanceResponseHandler = function(){
                    _takingInProgress = false;
                };

                var hidePopup = function(popupName){
                    var btn = nge.findOne('^buyTimeButtonContainer');

                    if(btn && popupName === 'insufficientFundsPopup')
                        btn.visible = true;
                };

                nge.observer.add('Transport.close', closePopup, false, true);
                nge.observer.add('Transport.close', resetBuyTimeResponseWaiting, false, true);

                // need close popup if state changing especialy for jackpots
                nge.observer.add('StatesManager.preload.start', closePopup, false, true);
                nge.observer.add('jackpot.start', closePopup, false, true);
                nge.observer.add('popup.hideStart', hidePopup, false, true);
                nge.observer.add('slotMachine.spinResponse', spinResponceHandler, false, true);
                nge.observer.add('transportMessage.BalanceResponse', balanceResponseHandler, false, true);
                nge.observer.add('StatesManager.create.end', cashPreload, 'cashPreload', true);
                nge.observer.add('StatesManager.create.end', cashCreate, false, true);
                nge.observer.add('StatesManager.create.end', resetBuyTimeResponseWaiting, false, true);
                nge.observer.add('transportMessage.BuyTimeResponse', buyTimeResponseHandler, false, true);
                nge.observer.add('transportMessage.BuyTimeResponse', resetBuyTimeResponseWaiting, false, true);
                nge.observer.add('window.resize', windowResizeHandler, false, true);
                nge.observer.add('entries.amount', processCashPopupValues, false, true);
            };
        }
    },
    totalBetSharedLogic: {
        1: function(){
            var textCheck = function(){
                nge.Common.Lib.Helper.objectClone('.creditsTotalBetNumber', '.creditsTotalBetNumberClone');
            };

            var totalBetUpdate = function() {
                if(!nge.localData.get('jackpot.jackpotCost') && !nge.localData.get('sweepStakes.enabled'))
                    return;

                textCheck();
    
                var totalBets = nge.findAll('.totalBetNumber');
                var totalBetsCredits = nge.findAll('.creditsTotalBetNumberClone');

                if (!totalBets)
                    return;

                //exeption in settings ui_v3 menu (we will leave one value)
                var settingsBetInCashNumber = nge.findOne('^settingsBetInCashNumber');
                var currency = nge.localData.get('balance.currency');

                if (!currency)
                    return;

                if(settingsBetInCashNumber){
                    var currencyColor = false;
                    var balanceComOriginal = nge.App.getInstance('Com.Balance.Controller');

                    if(balanceComOriginal && balanceComOriginal.currencyColor)
                        currencyColor = balanceComOriginal.currencyColor;
                    if (nge.localData.get('uiType') === 'gold') { //if in game no ui_v3 instance modes
                        currencyColor = '#EFC273';
                    } else if (nge.localData.get('uiType') === 'blue') {
                        currencyColor = '#CAEAFF';
                    } else if (nge.localData.get('uiType') === 'silver') {
                        currencyColor = '#DDDDDD';
                    }

                }
                
                var jCost = nge.localData.get('jackpot.jackpotCost') || 0;
                var jc = nge.Lib.Money.toCoins(jCost);
                var tb = nge.localData.get('totalBet.value');
                var cv = nge.localData.get('coins.value');
                var extraBet = nge.localData.get('extraBet');
                var extraBetValue = 1;

                // new versions of core and base games has new logic for extraBet
                if(typeof extraBet === 'object') // new 
                    extraBetValue = extraBet.value ? extraBet.multiplier : 1;
                else // old
                    extraBetValue = extraBet === '1' ? nge.localData.get('extraBetMult') : 1;

                if(nge.gameCode === '139') // for Book Of Ra Deluxe 6 there is no multiplier
                    extraBetValue = extraBet === '1' ? 2 : 1; // in localData nor in public vars

                var tbv = parseFloat(((tb / cv).toFixed(2) * extraBetValue) + jc);

                totalBetsCredits.forEach(function (tbn) {
                    tbn.text = tbv;
                });

                // draw sweepStakes totalbet
                if(nge.localData.get('sweepStakes.enabled')){
                    totalBets.forEach(function (tbn) {
                        tbn.text = tbv;
                    });

                    if(settingsBetInCashNumber){
                        var cashBetText = parseFloat(tbv * cv).toFixed(2) + ' ' + currency;
                        settingsBetInCashNumber.text = cashBetText;

                        if(currencyColor){
                            settingsBetInCashNumber.clearColors();
                            settingsBetInCashNumber.addColor(currencyColor, cashBetText.length - currency.length);
                        }
                    }

                    return;
                }

                // draw regular totalbet
                totalBets.forEach(function (tbn) {
                    var val = parseFloat((tb * extraBetValue) + jCost).toFixed(2) + ' ' + currency;
                    tbn.text = val;
                    
                    if(currencyColor){
                        tbn.clearColors();
                        tbn.addColor(currencyColor, val.length - currency.length);
                    }
                });
            };
            
            var _paidJackpotSubscribe = function(){
                nge.observer.add('totalBet.change', totalBetUpdate, false, true);
                nge.observer.add('game.readyToPlay', totalBetUpdate, false, true);
                nge.observer.add('paidJackpot.totalBetUpdate', totalBetUpdate, false, true);
                nge.observer.add('transportMessage.BalanceResponse', totalBetUpdate, false, true);
            };

            _paidJackpotSubscribe();
        }
    },
    customButtonsDefaultsCheck:{
        1: function(){
            var clbk = function(){
                location.replace(this);
            };

            var customButtonCheck = function(param, buttonName, imageKey){
                var paramValue = nge.Lib.Helper.parseGetParams(param);

                if(!paramValue)
                    return false;

                if(!window.customButtons)
                    window.customButtons = {};

                window.customButtons[buttonName] = {
                    imageKey: imageKey,
                    callback: clbk.bind(paramValue)
                };
            };

            //custom Buttons by default check
            customButtonCheck('homelink', 'customBtn01', 'home');
            customButtonCheck('cashlink', 'customBtn02', 'cash');
        }
    },
    jackpotsAndSpinConflict: {
        1: function (){
            var customCheckCanSpinOriginal = nge.brain._logicBlocksInstances.slot.customCheckCanSpin;

            //real bad hack, but logicBlocksInstances alredy created
            nge.brain._logicBlocksInstances.slot.customCheckCanSpin = function () {
                if (!customCheckCanSpinOriginal())
                    return false;

                if (nge.localData.get('jackpot.canPlay')) {
                    var freespinInProgress = nge.localData.get('freespin.inProgress');
                    var respinInProgress = nge.localData.get('respin.inProgress');

                    if (!freespinInProgress && !respinInProgress)
                        return false;
                }

                return true;
            };
        }
    },
    macOsX11HelperGetOs:{
        '_condition': function(){
            return(
                typeof nge.Lib !== 'undefined' &&
                typeof nge.Lib.Helper !== 'undefined'
            );
        },
        1: function(){
            nge.Lib.Helper.getOsAndVersion = function () {
                var unknown = '-';
                var nVer = navigator.appVersion;
                var nAgt = navigator.userAgent;
        
                // system
                var os = unknown;
                var clientStrings = [
                    {s: 'Windows 10', r: /(Windows 10.0|Windows NT 10.0)/},
                    {s: 'Windows 8.1', r: /(Windows 8.1|Windows NT 6.3)/},
                    {s: 'Windows 8', r: /(Windows 8|Windows NT 6.2)/},
                    {s: 'Windows 7', r: /(Windows 7|Windows NT 6.1)/},
                    {s: 'Windows Vista', r: /Windows NT 6.0/},
                    {s: 'Windows Server 2003', r: /Windows NT 5.2/},
                    {s: 'Windows XP', r: /(Windows NT 5.1|Windows XP)/},
                    {s: 'Windows 2000', r: /(Windows NT 5.0|Windows 2000)/},
                    {s: 'Windows ME', r: /(Win 9x 4.90|Windows ME)/},
                    {s: 'Windows 98', r: /(Windows 98|Win98)/},
                    {s: 'Windows 95', r: /(Windows 95|Win95|Windows_95)/},
                    {s: 'Windows NT 4.0', r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
                    {s: 'Windows CE', r: /Windows CE/},
                    {s: 'Windows 3.11', r: /Win16/},
                    {s: 'Android', r: /Android/},
                    {s: 'Open BSD', r: /OpenBSD/},
                    {s: 'Sun OS', r: /SunOS/},
                    {s: 'Linux', r: /(Linux|X11)/},
                    {s: 'iOS', r: /(iPhone|iPad|iPod)/},
                    {s: 'Mac OS X', r: /Mac OS X/},
                    {s: 'Mac OS', r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
                    {s: 'QNX', r: /QNX/},
                    {s: 'UNIX', r: /UNIX/},
                    {s: 'BeOS', r: /BeOS/},
                    {s: 'OS/2', r: /OS\/2/},
                    {s: 'Search Bot', r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
                ];
                for (var id in clientStrings) {
                    var cs = clientStrings[id];
                    if (cs.r.test(nAgt)) {
                        os = cs.s;
                        break;
                    }
                }
        
                var osVersion = unknown;
        
                if (/Windows/.test(os)) {
                    osVersion = /Windows (.*)/.exec(os)[1];
                    os = 'Windows';
                }
        
                switch (os) {
                    case 'Mac OS X':
                        osVersion = /Mac OS X (1[\.\_\d]+)/.exec(nAgt)[1];
                        break;
        
                    case 'Android':
                        osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
                        break;
        
                    case 'iOS':
                        osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                        osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
                        break;
                }
        
                return {os: os, version: osVersion};
            };
        }
    },
    iOS14PreserveDrawingBufferDisabling:{
        '_condition': function(){
            return(
                typeof nge.Mlm !== 'undefined' &&
                typeof nge.Mlm.States !== 'undefined'  && 
                typeof nge.Mlm.States.Controller !== 'undefined'
            );
        },
        1: function(){
            var isIos14 = /iPhone OS 14_/.test(navigator.userAgent);
            var isPhaser = typeof Phaser !== 'undefined' && typeof Phaser.VERSION !== 'undefined';

            if(!isIos14 || isPhaser)
                return false;

            var ctor = function() {
                var _self = this;
                this.states = {};
                this.loadingState;
                this.currentState;
                this.renderer;
                this.interaction;

                this.world;
                var _root;

                this.width = 0;
                this.height = 0;
                this.ratio = 1;

                var _loopLastCall = nge.Lib.Time.get();

                var _originalWidth;
                var _originalHeight;

                var _loaderState;

                var _loopStopped = false;
                var _loopPaused = false;

                this.init = function(config) {
                    
                    if (_self.renderer)
                        return _self;

                    _originalWidth = _self.width = config.width;
                    _originalHeight = _self.height = config.height;
                    var osData = nge.Lib.Helper.getOsAndVersion();

                    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;
                    PIXI.settings.TEXT_RESOLUTION = 1;

                    if (osData.os === 'iOS' || osData.os === 'Mac OS X')
                        PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH;
                
                    _self.renderer = new PIXI.WebGLRenderer({ width: config.width, height: config.height, antialias: config.antialias}); //todo: check if it is correct? if no - we shell use our renderer param
                    _self.renderer.state.blendModes[1] = [1, 1];
                    
                    document.body.appendChild(_self.renderer.view);

                    _root = new PIXI.Container();
                    _self._createWorld();

                    _self.interaction = new PIXI.interaction.InteractionManager({root: _root, view: _self.renderer.view});

                    _requestAnimFrame(_self.loop);
                    _self._applyPrototypes();

                    _loaderState = new nge.Mlm.States.State();

                    return _self;
                };

                this.loop = function() {
                    if (_loopStopped)
                        return false;

                    _requestAnimFrame(function () {
                        _self.loop();
                    });

                    if (!_loopPaused)
                        _self.update();

                    return true;
                };

                this.update = function() {
                    if (!_self.currentState || _self.currentState.isPaused())
                        return;

                    var deltaTime = _self._getDeltaTime();
                    _self.interaction.update(deltaTime);

                    _self.currentState.update();
                    _self.currentState.render();
                    _self.renderer.render(_root);
                };

                this.add = function(id, stateObject) {
                    if (_self.states[id])
                        return false;

                    var state = new nge.Mlm.States.State();
                    state = nge.Lib.Helper.mergeObjs(state, stateObject);
                    _self.states[id] = state;

                    return state;
                };

                this.checkState = function(id) {
                    return (typeof _self.states[id] !== 'undefined') ? true : false;
                };

                this.start = function(id, clearWorld) {
                    if (_self.states[id]) {
                        if (_self.currentState)
                            _self.currentState.pause();

                        _self.currentState = _loaderState;
                        _self.currentState.loadUpdate = _self.states[id].loadUpdate;
                        _self.currentState.resume();
                        _self.loadingState = _self.states[id];

                        _self._preload();

                        return true;
                    }

                    return false;
                };

                this.focusCanvas = function() {
                    nge.wrap.states.renderer.view.focus();
                };

                this.setCanvasWidth = function(val) {
                    $(_self.renderer.view).css('width', val);
                };


                this.setCanvasHeight = function(val) {
                    $(_self.renderer.view).css('height', val);
                };

                this.setCanvasBlur = function(val) {
                    var filterVal = 'blur('+ val +'px)';

                    $(_self.renderer.view)
                        .css('filter',filterVal)
                        .css('webkitFilter',filterVal)
                        .css('mozFilter',filterVal)
                        .css('oFilter',filterVal)
                        .css('msFilter',filterVal);
                };

                this.stopLoop = function() {
                    _loopStopped = true;
                };

                this.pauseLoop = function() {
                    _loopPaused = true;
                };

                this.resumeLoop = function() {
                    _self._getDeltaTime();
                    _loopPaused = false;
                };

                this.isPausedLoop = function() {
                    return _loopPaused;
                };

                this.resize = function(w, h) {
                    _self.width = w;
                    _self.height = h;
                    _self.renderer.resize(w, h);
                };

                this.resetLoopTime = function () {
                    _loopLastCall = Date.now();
                };

                this._preload = function() {
                    _self.loadingState.preload();
                    nge.wrap.load.onUpdate.add(_self._onUpdate);

                    nge.wrap.load.onComplete.addOnce(function () {
                        setTimeout(_self._create, 1);
                    });

                    nge.wrap.load.start();
                };

                this._onUpdate = function() {
                    _self.currentState.loadUpdate();
                };

                this._create = function() {
                    _self.currentState.pause();
                    _self._clearLoaderState();
                    _self.loadingState.create();
                    _self.currentState = _self.loadingState;
                    _self.loadingState = null;
                    _self.currentState.resume();
                };

                this._clearLoaderState = function() {
                    var staticContainers = _self.findStaticContainers();
                    var needCorrectClear = nge._versions && nge._versions.engine.split('.')[1] >= 6;

                    if(needCorrectClear){
                        for (var child of _self.world.children) {
                            child.destroy({children: true});
                            _self.world.removeChild(child);
                        }
                    } else {
                        while (_self.world.children[0]) {
                            _self.world.children[0].destroy();
                            _self.world.removeChild(_self.world.children[0]);
                        }
                    }

                    this.createStaticContainers(staticContainers);

                    _loaderState.loadUpdate = function () { };
                };

                this._rescale = function() {
                    _self.ratio = Math.min(window.innerWidth / _originalWidth, window.innerHeight / _originalHeight);
                    _self.width = _originalWidth * _self.ratio;
                    _self.height = _originalHeight * _self.ratio;
                    _self.renderer.resize(_self.width, _self.height);
                    _self.world.scale.x = _self.world.scale.y = _self.ratio;
                };

                var _requestAnimFrame = (function () {
                    return window.requestAnimationFrame ||
                        window.webkitRequestAnimationFrame ||
                        window.mozRequestAnimationFrame ||
                        window.oRequestAnimationFrame ||
                        window.msRequestAnimationFrame ||
                        function (/* function FrameRequestCallback */ callback, /* DOMElement Element */ element){
                            window.setTimeout(callback, 0);
                        };
                })();

                this._getDeltaTime = function () {
                    var newTime = Date.now();
                    var deltaTime = newTime - _loopLastCall;
                    _loopLastCall = newTime;

                    if (deltaTime < 0)
                        deltaTime = 0;

                    if (deltaTime > 1000)
                        deltaTime = 1000;

                    var deltaFrame = deltaTime * 60 / 1000; //1.0 is for single frame

                    return deltaFrame;
                };

                this._createWorld = function() {
                    _self.world = new PIXI.Container();
                    _root.addChild(_self.world);
                    _self._applyPrototypes();
                };

                this._applyPrototypes = function() {
                    _self.world.shutdown = _self._worldShutdown;
                };

                this._worldShutdown = function() {
                    //we need to save scale
                    var scaleX = _self.world.scale.x;
                    var scaleY = _self.world.scale.y;

                    var staticContainers = _self.findStaticContainers();

                    _self.world.destroy({children: true, texture: true, baseTexture: true});
                    _self._createWorld();
                    
                    this.createStaticContainers(staticContainers);

                    _self.world.scale.x = scaleX;
                    _self.world.scale.y = scaleY;
                };

                this.findStaticContainers = function() {
                    if(!nge.Lib.Helper.customRecursiveFind)
                        return [];
                    
                    var staticContainers = nge.Lib.Helper.customRecursiveFind(
                        'mt.data.dontDestroyOnChangeState',
                        true,
                        'children',
                        _self.world,
                        false,
                        false,
                        false
                    );

                    for(var i = 0; i < staticContainers.length; i++){
                        if(staticContainers[i].parent)
                            staticContainers[i].parent.removeChild(staticContainers[i]);
                    }

                    return staticContainers;
                };

                this.createStaticContainers = function(staticContainers) {
                    if(!staticContainers || staticContainers.length === 0)
                        return false;

                    var staticContainer = nge.objects.create(nge.Mlm.Objects.Folder({
                        name: 'staticContainer',
                        class:  ['Abstract', nge.App.getSysInstancesModes().join(' ')].join(' ')
                    }), _self.world);

                    for(var i = 0; i < staticContainers.length; i++)
                        nge.objects.createExisting(staticContainers[i], staticContainer);

                    nge.resolutionsManager.setOrientationClass();
                    nge.objects.setStyles();

                    return true;
                };
            }

            nge.Mlm.States.Controller = Class.extend(ctor);
        }
    },
    cookiesCrossDomainAndExpireFix:{
        '_condition': function(){
            return(
                typeof nge.Lib !== 'undefined' &&
                typeof nge.Lib.Helper !== 'undefined'
            );
        },
        1: function(){
            nge.Lib.Helper.setCookie = function (c_name, value, exdays) {
                if (typeof exdays === 'undefined')
                    exdays = 30 * 12; //one year
        
                var exdate = new Date;
                exdate.setDate(exdate.getDate() + exdays);
        
                var c_value = escape(value) + (!exdays ? '' : '; expires=' + exdate.toUTCString());
        
                var sameSiteString = location.protocol === 'https:' ? '; SameSite=None; Secure' : '';
                document.cookie = c_name + "=" + c_value + sameSiteString;

                return true;
            };
        }
    },
    jackpotsFontFix: {
        '_condition': function(){
            return(
                typeof nge.Lib !== 'undefined' &&
                typeof nge.Lib.Helper !== 'undefined'
            );
        },
        1: function(){
            var baseStatesManagerController = nge.Mlm.StatesManager.Controller;
            if (!baseStatesManagerController.extend)
                baseStatesManagerController = Class.extend(baseStatesManagerController);
            nge.Mlm.StatesManager.Controller = baseStatesManagerController.extend(function () {
                this.display = function (state, changeMode, clearWorld) {
                    if(state === 'load' && (nge.App.DjGameBase || nge.App.RiverGameBase || nge.gameCode === '277')) {
                        var pathJackpot = 'Com.Jackpot.Controller';
                        var jackpotController = nge.App.getPath('Com.Jackpot.Controller', false, 'jackpotController');
                        if(jackpotController) {
                            nge.Lib.Helper.recursiveSet(
                                'App.' + nge.appNS + '.' + pathJackpot,
                                jackpotController.extend(function () {
                                    this.initLayers = function () {
                                        var jackpotPopupWinContainer = nge.findOne('^jackpotPopupWinContainer');
                                        var jackpotPopupWinText = nge.findOne('^jackpotPopupWinText');
        
                                        jackpotPopupWinContainer.removeChild(jackpotPopupWinText);
                                        nge.Lib.Helper.objectDelete(jackpotPopupWinText, true);
        
                                        var textModel = new nge.Mlm.Objects.Text({
                                            name: 'jackpotPopupWinText',
                                            text: '',
                                            style: {
                                                font: '85pt "jackpotsFuturaHeavy"',
                                                fill: '#FDF296',
                                                stroke: '#FEF9CE',
                                                strokeThickness: 2,
                                                shadowColor: '#9A5500',
                                                shadowBlur: 6,
                                                shadowOffsetY: 6
                                            },
                                            gradient: [[0.1, '#FCEE7C'], [0.3, '#FCF086'], [0.6, '#F8D760'], [0.8, '#F3CA4A'], [0.99, '#F4C84E']],
                                            anchorX: 0.5, anchorY: 0.5,
                                            x: 0, y: 35
                                        });
                                        jackpotPopupWinText = nge.objects.create(textModel, jackpotPopupWinContainer, true);
                                        jackpotPopupWinText.text = '';
        
                                        this.super.initLayers();
                                    };
                                }),
                                nge
                            );
                        }
        
                        var pathLoadCfg = 'Com.Load.Cfg';
                        var loadCfg = nge.App.getPath('Com.Load.Cfg', false, 'loadCfg');
                        if (loadCfg) {
                            nge.Lib.Helper.recursiveSet(
                                'App.' + nge.appNS + '.' + pathLoadCfg,
                                loadCfg.extend(function () {
                                    var antiCacheSuffix = nge.assets.getAntiCacheSuffix();
                                    var heavyPath = nge.realPathPrefix + 'games/AfricanKingNG/css/fonts/FuturaPT-Heavy.otf' + antiCacheSuffix;
                                    var mediumPath = nge.realPathPrefix + 'games/AfricanKingNG/css/fonts/FuturaPT-Medium.otf' + antiCacheSuffix;
                                    this.fonts.jackpotsFuturaHeavy = heavyPath;
                                    for (var fontKey in this.fonts) {
                                        var fontPath = this.fonts[fontKey];
                                        var fontPathLower = fontPath.toLowerCase();
                                        if (fontPathLower.indexOf('segoe_ui_black') !== -1)
                                            this.fonts[fontKey] = heavyPath;
                                        if (fontPathLower.indexOf('futura') !== -1) {
                                            if (fontPathLower.indexOf('heavy') !== -1)
                                                this.fonts[fontKey] = heavyPath;
                                            if (fontPathLower.indexOf('medium') !== -1)
                                                this.fonts[fontKey] = mediumPath;
                                        }
                                    }
                                }),
                                nge
                            );
                        }
                    }

                    this.super.display(state, changeMode, clearWorld);
                };
            });
        }
    },
    funrizeModePatch: {
        '_condition': function(){
            return nge.HotPatches.patches.sweepsStakes._done && nge.parseGetParams('fnrz') === "true";
        },
        1: function(){
            var TEXT_TO_REPLACE = "PLAY LEVEL";
            var selectorsToMove = [
                '^buyTimeButtonContainer',
                '^buyTimeButton',
                '^UIQuickSettingsPanelContainer',
                '^sidebarHorizontalAnimationMobileButtonContainer',
                '^sidebarVerticalButtonMobile',
                '^quickSettingsPanelMobileButtonButton',
                '^settingPanelMobileBackBg',
                '^betSettingButtonMobileButton',
                '^settingBottomUIContainer',
                '^settingBottomUIMobileContainer',

            ];
            var selectorsToTextReplace = [
                '^totalBetCoinsText',
                '^totalBetMobileName'
            ];

            var moveSelectors = function(){
                selectorsToMove.forEach(function(selector){
                    var obj = nge.findOne(selector);

                    if(obj)
                        obj.scale.set(0);
                });
            }; 

            var changeTotalBetText = function(){
                selectorsToTextReplace.forEach(function(selector){
                    var obj = nge.findOne(selector);

                    if(obj)
                        obj.text = TEXT_TO_REPLACE;
                });
            };

            // handlers must run after handlers of sweepstakes
            nge.observer.add('transportMessage.AuthResponse',
                function () {
                    nge.observer.add('StatesManager.create.end', moveSelectors, false, true);
                    nge.observer.add('StatesManager.create.end', changeTotalBetText, false, true);
                },
                false,
                true
            );
        }
    }
};

nge.HotPatches.init = function(){
    if(nge.HotPatches.done)
        return false;

    //all is loaded, lets start
    var doneFlag = true;
    var patchesCfg = (nge.App && nge.App.getInstance && nge.App.getInstance('Cfg.HotPatches')) ? nge.App.getInstance('Cfg.HotPatches').get() : {};

    //lets go check our nge.HotPatches
    for(var patchName in nge.HotPatches.patches){
        if(!patchesCfg[patchName])
            patchesCfg[patchName] = 0;

        var condition = nge.HotPatches.patches[patchName]._condition || nge.HotPatches.conditionDefault;

        if(!condition()){
            doneFlag = false;
            continue;
        }

        for(var version in nge.HotPatches.patches[patchName]){
            if(version === '_condition')
                continue;

            if(patchesCfg[patchName] < version){
                if(!nge.HotPatches.patches[patchName]._done)
                    nge.HotPatches.patches[patchName][version]();

                patchesCfg[patchName] = +version;
            }
        }

        nge.HotPatches.patches[patchName]._done = true;
    }

    nge.HotPatches.done = doneFlag;
};

nge.HotPatches.conditionDefault = function(){
    return (
        typeof nge.App !== 'undefined' &&
        typeof nge.App.getInstance !== 'undefined' &&
        typeof nge.brain !== 'undefined' &&
        typeof nge.api !== 'undefined'
    );
};

//apply Hot Patches
(function(){
    var check = function(condition){
        nge.Common.Lib.Helper.conditionCheck(condition, nge.HotPatches.init, 1, 999999);
    };

    //onload Launch without async
    window.nge.phaserAdapter = null;
    nge.Common.Lib.Helper.makeReactive(window.nge, 'phaserAdapter', function(){nge.HotPatches.init();});

    //check default conditions
    check(nge.HotPatches.conditionDefault);

    //check custom conditions
    for(var patchName in nge.HotPatches.patches)
        if(nge.HotPatches.patches[patchName]._condition)
            check(nge.HotPatches.patches[patchName]._condition);
})();
