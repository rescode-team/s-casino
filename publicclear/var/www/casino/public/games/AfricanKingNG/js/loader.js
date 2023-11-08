(function () {
    var gameLoadCfg = 'js/loadCfg.js';
    var cssPaths = [
        '../../css/main.css',
        '../../css/jquery.treetable.css',
        '../../css/jquery.treetable.theme.default.css',
        '../../css/loader.css'
    ];
    var jsPaths = [
        '../../js/mnt/jquery/jquery-2.1.3.min.js',
        '../../js/mnt/sockjs.min.js',
        '../../js/mnt/progressbar/progressbar.min.js',
        '../../js/common.js'
    ];

    var loadVersions = function(callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '../../versions.json?' + Math.random(), true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState != 4) 
                return;
            if (xhr.status != 200)
                return callback('load versions failed');
            callback(null, JSON.parse(xhr.responseText));
        };
        xhr.send();
    };

    var loadApp = function(){
        if(typeof WEBPACK === 'undefined')
            return kick();

        window.WEBPACK_VERSION = window.WEBPACK_VERSION || 0;
        switch(window.WEBPACK_VERSION) {
            case 1:
                loadVersions(function(err, packages) {
                    if(err)
                        console.error(err);
                    
                    if(!err && packages && packages[GAMECODE]) {
                        var i = 0;
                        var names = [];
                        var codes = [];
                        for(var name in packages[GAMECODE]) {
                            names.push(name);
                            codes.push(packages[GAMECODE][name]);
                        }
            
                        var callback = function() {
                            if(names.length === i) {
                                return loadGameBundle().then(kick)
                                    .catch(function(err) {
                                        console.error(err);
                                    });
                            }
                            console.log('load ' + names[i] + '-' + codes[i]);
                            var antiCacheSuffix = '';

                            if(codes[i].indexOf('x') !== -1){
                                antiCacheSuffix = '&rnd=' + makeid();
                            }

                            loadJsCssFile('../../packages/' + names[i] + '/' + codes[i] + '/' + names[i] + '.js?gameVersion=' + gameVersion + antiCacheSuffix, 'js', callback);
                            i++;
                        };
                        callback();
                        
                    } else if(MODE === 'development') {
                        loadPackedVendorBundles()
                            .then(loadGameBundle)
                            .then(kick).catch(function(err) {
                                console.error(err);
                            });
                    }
                    else
                        console.error('Failed to load versions for ' + GAMECODE);
                }); 
                break;
            default:
                webpackLoadInit();
                break;
        }
    };

    var checkGameVersion = function () {
        return (typeof gameVersion !== 'undefined');
    };

    var parseGetParams = function (name) {
        var $_GET = {};
        //var _GET = window.location.hash.substring(1).split("?");
        var _GET = window.location.href.substring(1).split("?");
        if (_GET[1]) {
            var __GET = _GET[1].split("&");
            for (var i = 0; i < __GET.length; i++) {
                var getVar = __GET[i].split("=");
                $_GET[getVar[0]] = typeof getVar[1] === "undefined" ? "" : getVar[1];
            }
        }

        if (!name)
            return $_GET;

        return $_GET[name];
    };

    function makeid() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 32; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }

    var loadJsCssFile = function (filename, filetype, callback) {
        if (filetype === "js") { //if filename is a external JavaScript file
            var fileref = document.createElement('script');
            fileref.setAttribute("type", "text/javascript");
            fileref.setAttribute("src", filename);
        } else if (filetype === "css") { //if filename is an external CSS file
            var fileref = document.createElement("link");
            fileref.setAttribute("rel", "stylesheet");
            fileref.setAttribute("type", "text/css");
            fileref.setAttribute("href", filename);
        }

        if (fileref && callback)
            fileref.onload = fileref.onreadystatechange = callback;


        if (typeof fileref !== "undefined")
            document.getElementsByTagName("head")[0].appendChild(fileref);
    };

    var preload = function () {
        if (!storage[i]) {
            if (preloadCallback)
                preloadCallback();
            return false;
        }

        loadJsCssFile(storage[i] + '?commonVersion=' + commonVersion, type, preload);
        i++;
    };

    var commonVersion = parseGetParams('commonVersion');
    var gameVersionIsset = checkGameVersion();

    var i = 0;
    var storage = cssPaths;
    var type = 'css';
    var preloadCallback = function () {
        i = 0;
        storage = jsPaths;
        type = 'js';
        preloadCallback = function () {
            loadJsCssFile(gameLoadCfg + '?gameVersion=' + gameVersion, 'js', loadApp);
        };
        preload();
    };

    if(typeof WEBPACK !== 'undefined') {
        preloadCallback = function () {
            i = 0;
            storage = jsPaths;
            type = 'js';
            preloadCallback = loadApp;
            preload();
        };
    }
    //todo remove if and use only preload(); after all games version will be 2.31.02 or higher
    if (gameVersionIsset)
        preload();
    else {
        //version < 2.31.02
        window.gameVersion = makeid();
        loadJsCssFile('../../js/common.js?gameVersion=' + gameVersion, 'js', loadApp);
    }
    
})();
