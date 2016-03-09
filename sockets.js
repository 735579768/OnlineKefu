var debug=function(obj){
	console.log("--------------------------------------------------------------")
	console.log(obj);
	 //io.sockets.emit('debug',obj);
	};
//数据库连接
 var db= require('mysql')
var conn = db.createConnection({
 host     : 'localhost',
 user     : 'root',
 password : 'adminrootkl',
 database : 'onlinekefu'
});
conn.connect();
var mysqlquery=function(sql,callback){
	conn.connect();
	conn.query('SELECT * from kl_kefu limit 10', function(err, rows, fields) {
	 if (err) throw err;
	for(i in rows){
	console.log(rows[i]['kefu_id']);
	console.log(rows[i]['name']);
	}
	});
	conn.end();
};
rooms=new socketrooms();
console.log(rooms);
var sockets={
	run:function(io){
		var _this=this;
		var numUsers = 0;
		var clientLists={};
		//返回当前房间用户
		var getuserlist=function(roomid){
		  	//查询用户名列表
/*			var userlist=[];
			for(var a in io.sockets.adapter.rooms[roomid]){
				//console.log(a);
				var o=io.sockets.connected[a];
				userlist.push({'id':o.id,'name':o.username});
			}
			return userlist;*/
			var userlist=[];
			for(var a in clientLists[roomid]['clients']){
				//console.log(a);
				var o=clientLists[roomid]['clients'][a];
				userlist.push({'id':o.id,'name':o.name});
			}
			return userlist;
		};
		var getusernums=function(roomid){
			//更新加入房间的人数
			var romnum=0;
/*			for(var a in io.sockets.adapter.rooms[roomid]){
					romnum++;
				}*/
			for(var a in clientLists[roomid]['clients']){
				romnum++;
			}
			return romnum;
		};
		//发送消息
		var sendmessage=function(socket,msgtype,msg){
			if(socket){
				socket.emit(msgtype,msg);
			}else{
				return false;
			}
		};
		//WebSocket连接监听
		io.on('connection', function (socket) {
		  // 构造客户端对象
		  var client = {
			sessionid:sessionid,
			socketid:socket.id,
			kefuid:'',
			name:'',
			isadmin:0,
			roomtitle:'公共聊天大厅',
			roomid:'',
			color:getColor()
		  }
		  socket.emit('open');
		  ++numUsers;
		  //默认进入同一个房间
		  //socket.leave(socket.id);
		  //socket.join('聊天大厅');
		  //发送激活状态的聊天室
		  //io.sockets.emit('jihuorooms',io.sockets.adapter.rooms);
		  //io.sockets.emit('totalusernums','总共'+numUsers+'个用户');
		  //socket.emit('join room',client);

		 //加入房间;
		  socket.on('join room',function(myinfo){
			socket.roomtitle=myinfo.roomtitle;
			socket.username=myinfo.myname;
			client.name=myinfo.myname;
			client.roomid=myinfo.roomid;
			client.roomtitle=myinfo.roomtitle;
			client.isadmin=myinfo.isadmin;
			var roomid=myinfo.roomid;

			if(clientLists[myinfo.roomid]){
				if(client.isadmin==1){
					clientLists[myinfo.roomid]['admin']=client;
					rooms.addkefu(client);
				}else{
					clientLists[myinfo.roomid]['clients'][client.socketid]=client;
					rooms.addclient(client);
				}

			}else{
				clientLists[myinfo.roomid]={'admin':null,'clients':{}};
				rooms.deleteroom(myinfo.roomid);
			}
			console.log(rooms);
			//console.log(clientLists);
/*
			//更新离开房间的人数
			var romnum=0;
			for(var a in io.sockets.adapter.rooms[roomid]){
				romnum++;
				}*/
			//io.sockets.to(roomid).emit('usernums','当前房间'+romnum+'个用户');



			socket.join(roomid);
			//对自己进行回复
			var soc=io.sockets.connected[client.socketid];
			if(client.isadmin==1){
				sendmessage(soc,'system',getMessage(client,'成功登陆客服系统!'));
			}else{
				sendmessage(soc,'system',getMessage(client,'请问您有什么问题吗?'));
				//sendmessage(soc,'select kefu',getMessage(client,[{'id':1,'name':'客服1'},{'id':2,'name':'客服2'},{'id':3,'name':'客服3'}]));
			try{
				conn.query('SELECT * from kl_kefu limit 10', function(err, rows, fields) {
				if (err) throw err;
				var kefulist=[];
				for(i in rows){
					kefulist.push({'id':rows[i]['kefu_id'],'name':rows[i]['name']})
				}
				sendmessage(soc,'select kefu',getMessage(client,kefulist));
				});
				//conn.end();
			}catch(e){
				console.log(e);
			}
			}
			//对自己进入的房间给别人回复


/*			//查询用户名列表
			var userlist=[];
			for(var a in io.sockets.adapter.rooms[roomid]){
				console.log(a);
				var o=io.sockets.connected[a];
				userlist.push(o.username);
				}*/

			if(clientLists[client.roomid]['admin']!=null){
				//发送给管理员
				socketid=clientLists[client.roomid]['admin'].socketid;
				var soc=io.sockets.connected[socketid];
				sendmessage(soc,'system',getMessage(client,'欢迎\'  '+client.name+'  \'使用客服系统!'));
				sendmessage(soc,'username lists',getuserlist(roomid));
				sendmessage(soc,'usernums','当前'+getusernums(roomid)+'个客户');
			}

			//socket.emit('set roomtitle',client);
			//发送激活状态的聊天室
			//io.sockets.emit('room number',io.sockets.adapter.rooms);
			//console.log('当前用户'+getusernums(client.roomid)+'个');
			console.log('当前用户'+rooms.getclientnums(client.roomid)+'个');
		   });

		  // 对message事件的监听
		  socket.on('message', function(msg){
		  		msg=eval('(' + msg + ')');
		  		//msg=eval(msg);
				var khid=msg.id;
		  		msg=msg.msg;
		  		if(client.isadmin==1 && !khid){
		  			sendmessage( io.sockets.connected[client.socketid],'system',getMessage(client,'请选择一个客户!'));
		  			return false;
		  		}
				//如果是管理员,对指定客户回复
				if(client.isadmin==1){
					sendmessage(io.sockets.connected[khid],'message',getMessage(client,msg));
				}else{
					if(clientLists[client.roomid]['admin']){
					//否则转发给管理员
					socketid=clientLists[client.roomid]['admin'].socketid;
					sendmessage( io.sockets.connected[socketid],'message',getMessage(client,msg));
					}else{
						//临时存到数据库
					}
				}
		  		//对自己进行回复
		  		sendmessage(io.sockets.connected[client.socketid],'message',getMessage(client,msg));
			});
			//监听出退事件
		  socket.on('disconnect', function () {
		  	try{
			  var obj = {
				time:getTime(),
				color:client.color,
				username:'系统消息',
				text:client.name+' 已经退出',
				id:client.socketid
			  };
			  //广播用户数量
			  --numUsers;
			  //io.sockets.to().emit('system',obj);
			  //io.sockets.emit('totalusernums','总共'+numUsers+'个用户');

				if(client.isadmin==0){
					delete clientLists[client.roomid]['clients'][client.socketid];
					rooms.deleteclient(client);
				}else{
					clientLists[client.roomid]['admin']=null;
					rooms.deletekefu(client);
				}
				if(!clientLists[client.roomid]['clients'] &&!clientLists[client.roomid]['admin']){
					delete clientLists[client.roomid];
					rooms.deleteroom(client.roomid);
				}
			  	//发送给管理员
			  	if(client.isadmin==0 && clientLists[client.roomid]['admin']!=null){
				  	socketid=clientLists[client.roomid]['admin'].socketid;
				  	var soc=io.sockets.connected[socketid];
				  	sendmessage(soc,'userleft',obj);
					sendmessage(soc,'username lists',getuserlist(client.roomid));
					sendmessage(soc,'usernums','当前'+getusernums(client.roomid)+'个用户');
				}
			  console.log('当前用户'+getusernums(client.roomid)+'个');
			  }catch(e){
			  	console.log(e);
			  }
			});

		  socket.on('error', function (err) {
				console.error(err.stack); // TODO, cleanup
			});

		});
		}
	};
module.exports=sockets;