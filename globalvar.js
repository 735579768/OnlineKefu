global.sessionid=null;
global.debug=function(obj){
	console.log("--------------------------------------------------------------")
	console.log(obj);
	 //io.sockets.emit('debug',obj);
	};
global.getMessage=function(client,msg){
    var obj = {
		client:client,
		sid:client.socketid,
		time:getTime(),
		color:client.color,
		text:msg,
		username:client.name
		};
		return obj;
	};
global.getTime=function(){
  var date = new Date();
  var h=date.getHours();
  var m=date.getMinutes();
  var s=date.getSeconds();
  h=h>9?h:('0'+h)
  m=m>9?m:('0'+m)
  s=s>9?s:('0'+s)
  return h+":"+m+":"+s;
}

global.getColor=function(){
  return '#666;';
}