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
global.socketrooms=function(){
	this.rooms={};
};
socketrooms.prototype={
	//添加房间
	addroom:function(roomid){
		if(!this.rooms[roomid]){
			this.rooms[roomid]={
				kefu:{},
				clients:{}
			};
		}
	},
	//删除房间
	deleteroom:function(roomid){
		if(this.rooms[roomid]){
			delete this.rooms[roomid];
		}
	},
	//向房间里添加在线客户
	addclient:function(roomid,client){
		this.addroom(roomid);
		this.rooms[roomid]['clients'][client.socketid]=client;

	},
	//从房间里删除在线客户
	deleteclient:function(roomid,client){
		try{
		delete this.rooms[roomid]['clients'][client.socketid];
		}catch(e){
			console.log(e);
		}
	},
	//向房间里添加在线客服
	addkefu:function(roomid,client){
		this.addroom(roomid);
		this.rooms[roomid]['kefu'][client.socketid]=client;

	},
	//从房间里删除在线客服
	deletekefu:function(roomid,client){
		try{
		delete this.rooms[roomid]['kefu'][client.socketid];
		}catch(e){
			console.log(e);
		}
	},
	//返回当前房间的在线客户列表
	getallclient:function(roomid){
		return this.rooms[roomid]['clients'];
	},
	//返回当前房间的在线客服列表
	getallkefu:function(roomid){
		return this.rooms[roomid]['kefu'];
	},
	//返回当前房间在线客户数量
	getclientnum:function(){
		var num=0;
		for(i in this.rooms[roomid]['clients']){
			num++;
		}
		return num;
	}

};