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
				//在线客服
				onlinekefu:{},
				//所有客服
				kefu:{},
				clients:{}
			};
		}
	},
	//删除房间
	deleteroom:function(roomid){
		if(this.rooms[roomid] && !this.rooms[roomid]['kefu'] && !this.rooms[roomid]['clients']){
			delete this.rooms[roomid];
		}
	},
	//向房间里添加在线客户
	addclient:function(client){
		this.addroom(client.roomid);
		this.rooms[client.roomid]['clients'][client.socketid]=client;
	},
	//更新客户信息
	updateclient:function(client){
		this.addclient(client);
	},
	//从房间里删除在线客户
	deleteclient:function(client){
		try{
		delete this.rooms[client.roomid]['clients'][client.socketid];
		this.deleteroom(client.roomid);
		}catch(e){
			console.log(e);
		}
	},
	//向房间里添加在线客服
	addkefu:function(client){
		this.addroom(client.roomid);
		this.rooms[client.roomid]['onlinekefu'][client.socketid]=client;

	},
	//更新客服信息
	updatekefu:function(client){
		this.addkefu(client);
	},
	//从房间里删除在线客服
	deletekefu:function(client){
		try{
		delete this.rooms[client.roomid]['onlinekefu'][client.socketid];
		this.deleteroom(client.roomid);
		}catch(e){
			console.log(e);
		}
	},
	//返回当前房间的在线客户列表
	getallclient:function(roomid){
		return this.rooms[roomid]['clients'];
	},
	//返回当前房间的所有客服列表(包含不在线的)
	getallkefu:function(roomid){
		return this.rooms[roomid]['kefu'];
	},
	//通过id返回当前房间客服
	getkefubyid:function(roomid,id){
		return this.rooms[roomid]['kefu'][id];
	},
	//返回当前房间的在线客服列表
	getallonlinekefu:function(roomid){
		return this.rooms[roomid]['onlinekefu'];
	},
	//通过id返回当前房间在线客服
	getonlinekefubyid:function(roomid,id){
		return this.rooms[roomid]['onlinekefu'][id];
	},
	//返回当前房间在线客户数量
	getclientnums:function(roomid){
		var num=0;
		try{
			for(i in this.rooms[roomid]['clients']){
				num++;
			}
			return num;
		}catch(e){
			return 0;
		}

	},
	setkefulist:function(roomid,kefulist){
		this.addroom(roomid);
		this.rooms[roomid]['kefu']=kefulist;
	}

};