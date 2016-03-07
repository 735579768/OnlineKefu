var debug=function(obj){
	console.log("--------------------------------------------------------------")
	console.log(obj);
	 //io.sockets.emit('debug',obj);
	};
var sockets={
	run:function(io){
		var numUsers = 0;
		var clientLists={};
		//返回当前房间用户
		var getuserlist=function(roomid){
		  	//查询用户名列表
			var userlist=[];
			for(var a in io.sockets.adapter.rooms[roomid]){
				//console.log(a);
				var o=io.sockets.connected[a];
				userlist.push({'id':o.id,'name':o.username});
			}
			return userlist;
		};
		var getusernums=function(roomid){
			//更新加入房间的人数
			var romnum=0;
			for(var a in io.sockets.adapter.rooms[roomid]){
				romnum++;
				}
			return romnum;
		};
		//WebSocket连接监听
		io.on('connection', function (socket) {
		  // 构造客户端对象
		  var client = {
			sessionid:sessionid,
			socketid:socket.id,
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
		    	clientLists[myinfo.roomid]['clients'][client.socketid]=client;
			}else{
				clientLists[myinfo.roomid]={'admin':null,'clients':{}};
			}
			if(client.isadmin==1){
				clientLists[myinfo.roomid]['admin']=client;
			}
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
			if(client.isadmin==1){
				io.sockets.connected[client.socketid].emit('system',getMessage(client,'成功登陆客服系统!'));
			}else{
				io.sockets.connected[client.socketid].emit('system',getMessage(client,'请问您有什么问题吗?'));
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
				io.sockets.connected[socketid].emit('system',getMessage(client,'欢迎\'  '+client.name+'  \'使用客服系统!'));
				io.sockets.connected[socketid].emit('username lists',getuserlist(roomid));
				io.sockets.connected[socketid].emit('usernums','当前'+getusernums(roomid)+'个客户');
			}
			//socket.emit('set roomtitle',client);
			//发送激活状态的聊天室
			//io.sockets.emit('room number',io.sockets.adapter.rooms);
		   });

		  // 对message事件的监听
		  socket.on('message', function(msg){
		  	console.log(msg);
		  	msg=eval('(' + msg + ')');
		  	console.log(msg.id);
		  		//msg=eval(msg);
				var khid=msg.id;
		  		msg=msg.msg;

		  		//khid=msg;
		  		//对自己进行回复
		  		io.sockets.connected[client.socketid].emit('message',getMessage(client,msg));

		  		console.log('khid:',khid);
				//如果是管理员,对指定客户回复
				if(client.isadmin==1){
					io.sockets.connected[khid].emit('message',getMessage(client,msg));
				}else{
					//否则转发给管理员
					socketid=clientLists[client.roomid]['admin'].socketid;
					io.sockets.connected[socketid].emit('message',getMessage(client,msg));
				}
			});
			//监听出退事件
		  socket.on('disconnect', function () {
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
				}else{
					clientLists[client.roomid]['clients']['admin']=null;
				}
			  	//发送给管理员
			  	if(client.isadmin==0 && clientLists[client.roomid]['admin']!=null){
				  	socketid=clientLists[client.roomid]['admin'].socketid;
				  	io.sockets.connected[socketid].emit('userleft',obj);
					io.sockets.connected[socketid].emit('username lists',getuserlist(client.roomid));
					io.sockets.connected[socketid].emit('usernums','当前'+getusernums(client.roomid)+'个用户');
				}

			  console.log(obj.text);
			});

		  socket.on('error', function (err) {
				console.error(err.stack); // TODO, cleanup
			});

		});
		}
	};
module.exports=sockets;