function resources(){var N='',O=0,P='resources',Q='startup',R='bootstrap',S='begin',T='gwt.codesvr=',U='gwt.hosted=',V='gwt.hybrid',W='moduleStartup',X='end',Y='#',Z='?',$='/',_=1,ab='img',bb='clear.cache.gif',cb='baseUrl',db='script',eb='resources.nocache.js',fb='undefined',gb='__gwt_marker_resources',hb='<script id="',ib='"><\/script>',jb='SCRIPT',kb='base',lb='//',mb='meta',nb='name',ob='resources::',pb='::',qb='gwt:property',rb='content',sb='=',tb='gwt:onPropertyErrorFn',ub='Bad handler "',vb='" for "gwt:onPropertyErrorFn"',wb='gwt:onLoadErrorFn',xb='" for "gwt:onLoadErrorFn"',yb='Cross-site hosted mode not yet implemented. See issue ',zb='http://code.google.com/p/google-web-toolkit/issues/detail?id=2079',Ab='selectingPermutation',Bb='883BD5E107C08ECC8077A4B1B7EF865E',Cb=':',Db='DOMContentLoaded',Eb=50,Fb='loadExternalRefs',Gb='js/uaparser.js',Hb='<script language="javascript" src="',Ib='js/uaparser.js"><\/script>',Jb='js/messenger.js',Kb='js/messenger.js"><\/script>',Lb='"<script src=\\"',Mb='.cache.js\\"><\/scr" + "ipt>"',Nb='<scr',Ob='ipt><!-',Pb='-\n',Qb='window.__gwtStatsEvent && window.__gwtStatsEvent({',Rb='moduleName:"resources", sessionId:window.__gwtStatsSessionId, subSystem:"startup",',Sb='evtGroup: "loadExternalRefs", millis:(new Date()).getTime(),',Tb='type: "end"});',Ub='evtGroup: "moduleStartup", millis:(new Date()).getTime(),',Vb='type: "moduleRequested"});',Wb='document.write(',Xb=');',Yb='\n-',Zb='-><\/scr',$b='ipt>';var m=window,n=document,o=m.__gwtStatsEvent?function(a){return m.__gwtStatsEvent(a)}:null,p=m.__gwtStatsSessionId?m.__gwtStatsSessionId:null,q,r,s=N,t={},u=[],v=[],w=[],A=O,B,C;o&&o({moduleName:P,sessionId:p,subSystem:Q,evtGroup:R,millis:(new Date).getTime(),type:S});if(!m.__gwt_stylesLoaded){m.__gwt_stylesLoaded={}}if(!m.__gwt_scriptsLoaded){m.__gwt_scriptsLoaded={}}function D(){var b=false;try{var c=m.location.search;return (c.indexOf(T)!=-1||(c.indexOf(U)!=-1||m.external&&m.external.gwtOnLoad))&&c.indexOf(V)==-1}catch(a){}D=function(){return b};return b}
function F(){if(q&&r){q(B,P,s,A);o&&o({moduleName:P,sessionId:p,subSystem:Q,evtGroup:W,millis:(new Date).getTime(),type:X})}}
function G(){function e(a){var b=a.lastIndexOf(Y);if(b==-1){b=a.length}var c=a.indexOf(Z);if(c==-1){c=a.length}var d=a.lastIndexOf($,Math.min(c,b));return d>=O?a.substring(O,d+_):N}
function f(a){if(a.match(/^\w+:\/\//)){}else{var b=n.createElement(ab);b.src=a+bb;a=e(b.src)}return a}
function g(){var a=__gwt_getMetaProperty(cb);if(a!=null){return a}return N}
function h(){var a=n.getElementsByTagName(db);for(var b=O;b<a.length;++b){if(a[b].src.indexOf(eb)!=-1){return e(a[b].src)}}return N}
function i(){var a;if(typeof isBodyLoaded==fb||!isBodyLoaded()){var b=gb;var c;n.write(hb+b+ib);c=n.getElementById(b);a=c&&c.previousSibling;while(a&&a.tagName!=jb){a=a.previousSibling}if(c){c.parentNode.removeChild(c)}if(a&&a.src){return e(a.src)}}return N}
function j(){var a=n.getElementsByTagName(kb);if(a.length>O){return a[a.length-_].href}return N}
function k(){var a=n.location;return a.href==a.protocol+lb+a.host+a.pathname+a.search+a.hash}
var l=g();if(l==N){l=h()}if(l==N){l=i()}if(l==N){l=j()}if(l==N&&k()){l=e(n.location.href)}l=f(l);s=l;return l}
function H(){var b=document.getElementsByTagName(mb);for(var c=O,d=b.length;c<d;++c){var e=b[c],f=e.getAttribute(nb),g;if(f){f=f.replace(ob,N);if(f.indexOf(pb)>=O){continue}if(f==qb){g=e.getAttribute(rb);if(g){var h,i=g.indexOf(sb);if(i>=O){f=g.substring(O,i);h=g.substring(i+_)}else{f=g;h=N}t[f]=h}}else if(f==tb){g=e.getAttribute(rb);if(g){try{C=eval(g)}catch(a){alert(ub+g+vb)}}}else if(f==wb){g=e.getAttribute(rb);if(g){try{B=eval(g)}catch(a){alert(ub+g+xb)}}}}}}
__gwt_isKnownPropertyValue=function(a,b){return b in u[a]};__gwt_getMetaProperty=function(a){var b=t[a];return b==null?null:b};resources.onScriptLoad=function(a){resources.onScriptLoad=null;q=a;F()};if(D()){alert(yb+zb);return}H();G();o&&o({moduleName:P,sessionId:p,subSystem:Q,evtGroup:R,millis:(new Date).getTime(),type:Ab});var I;try{I=Bb;var J=I.indexOf(Cb);if(J!=-1){A=Number(I.substring(J+_));I=I.substring(O,J)}}catch(a){return}var K;function L(){if(!r){r=true;F();if(n.removeEventListener){n.removeEventListener(Db,L,false)}if(K){clearInterval(K)}}}
if(n.addEventListener){n.addEventListener(Db,function(){L()},false)}var K=setInterval(function(){if(/loaded|complete/.test(n.readyState)){L()}},Eb);o&&o({moduleName:P,sessionId:p,subSystem:Q,evtGroup:R,millis:(new Date).getTime(),type:X});o&&o({moduleName:P,sessionId:p,subSystem:Q,evtGroup:Fb,millis:(new Date).getTime(),type:S});if(!__gwt_scriptsLoaded[Gb]){__gwt_scriptsLoaded[Gb]=true;document.write(Hb+s+Ib)}if(!__gwt_scriptsLoaded[Jb]){__gwt_scriptsLoaded[Jb]=true;document.write(Hb+s+Kb)}var M=Lb+s+I+Mb;n.write(Nb+Ob+Pb+Qb+Rb+Sb+Tb+Qb+Rb+Ub+Vb+Wb+M+Xb+Yb+Zb+$b)}
resources();