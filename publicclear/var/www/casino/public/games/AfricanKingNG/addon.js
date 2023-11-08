

function AlignVertical(){


setInterval(function(){

try{
var canv = document.getElementsByTagName('canvas')[0];
var hc=canv.style['height'].split('px')[0];	
var hw=window.innerHeight;	
var wc=canv.style['width'].split('px')[0];	
var ww=window.innerWidth;	
canv.style['position']='fixed';	
canv.style['top']=((hw-hc)/2)+'px';	
canv.style['left']=((ww-wc)/2)+'px';	

}catch(e){}

},1000);




	
	
}

(function(){

var exitBtn=document.createElement('div');
exitBtn.style['background']='rgba(0, 0, 0, 0.5)';
exitBtn.style['border']='1px solid white';
exitBtn.style['border-radius']='5px';
exitBtn.style['right']='4px';
exitBtn.style['top']='4px';
exitBtn.style['width']='70px';
exitBtn.style['height']='25px';
exitBtn.style['position']='fixed';
exitBtn.style['z-index']='1000';
exitBtn.style['text-align']='center';
exitBtn.style['font-size']='22px';
exitBtn.style['color']='white';
exitBtn.style['font-family']='sans-serif';
exitBtn.style['padding-top']='0px';
exitBtn.style['cursor']='pointer';
exitBtn.innerHTML='EXIT';


exitBtn.addEventListener('click',function(){

var isFramed = false;
try {
	isFramed = window != window.top || document != top.document || self.location != top.location;
} catch (e) {
	isFramed = true;
}
var exitUrl='/';
		if(document.location.href.split("api_exit=")[1]!=undefined){
		exitUrl=document.location.href.split("api_exit=")[1].split("&")[0];
		}
if(isFramed ){
window.parent.postMessage('CloseGame',"*");
}
document.location.href=exitUrl;


});

setTimeout(function(){
document.body.appendChild(exitBtn);

if(device.desktop() || device.tablet()){

AlignVertical();

	
}

},2000);





}





)();



