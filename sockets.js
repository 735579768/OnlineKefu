var debug=function(obj){
	console.log("--------------------------------------------------------------")
	console.log(obj);
	 //io.sockets.emit('debug',obj);
	};
var sockets={
	run:function(io){
		var numUsers = 0;
		var clientLists=new Array();
		//WebSocket连接监听
		io.on('connection', function (socket) {
		  // 构造客户端对象
		  var client = {
			sessionid:sessionid,
			socketid:socket.id,
			name:'',
			roomtitle:'公共聊天大厅',
			roomid:'聊天大厅',
			color:getColor()
		  } 
		  socket.emit('open');
		  ++numUsers;
		  //默认进入同一个房间
		  socket.leave(socket.id);
		  socket.join('聊天大厅');
		  //发送激活状态的聊天室
		  io.sockets.emit('jihuorooms',io.sockets.adapter.rooms);
		  io.sockets.emit('totalusernums','总共'+numUsers+'个用户');
		  clientLists.push(client);
		  socket.emit('join room',client);
		
		 //加入房间;
		  socket.on('join room',function(myinfo){
			socket.roomtitle=myinfo.roomtitle;
			socket.username=myinfo.myname;
			client.name=myinfo.myname;
			client.roomid=myinfo.roomid;
			client.roomtitle=myinfo.roomtitle;
			var roomid=myinfo.roomid;
			
			//保证自己只在一个房间
			var isjoin=true;
			for(var a in socket.rooms){
				var roomname=socket.rooms[a];
				if(roomname==roomid){
					isjoin=false;
					}else{
					socket.leave(roomname);
					io.sockets.to(roomname).emit('system',getMessage(client,client.name+'离开房间'));
					//更新离开房间的人数
					var romnum=0;
					for(var a in io.sockets.adapter.rooms[roomname]){
						romnum++;
						}
					io.sockets.to(roomname).emit('usernums','当前房间'+romnum+'个用户');
					//查询用户名列表
					var userlist=[];
					for(var a in io.sockets.adapter.rooms[roomname]){
						var o=io.sockets.connected[a];
						userlist.push(o.username);
						}
					io.sockets.to(roomname).emit('username lists',userlist);
					
					}	
				}
			if(isjoin){
				socket.join(roomid);
				//对自己进入的前房间进行回复
				socket.emit('system',getMessage(client,'您已进入'+roomid+'号房间'));
				//对自己进入的房间给别人回复
				socket.broadcast.to(roomid).emit('system',getMessage(client,'欢迎\'  '+client.name+'  \'进入聊天室'));
			}else{
				socket.emit('system',getMessage(client,'您已经在房间内!'));
				}
			//更新加入房间的人数
			var romnum=0;
			for(var a in io.sockets.adapter.rooms[roomid]){
				romnum++;
				}
			//查询用户名列表
			var userlist=[];
			for(var a in io.sockets.adapter.rooms[roomid]){
				var o=io.sockets.connected[a];
				userlist.push(o.username);
			}
			io.sockets.to(roomid).emit('username lists',userlist);
			io.sockets.to(roomid).emit('usernums','当前房间'+romnum+'个用户');
			client.room=roomid;
			socket.emit('set roomtitle',client);
			//发送激活状态的聊天室
			io.sockets.emit('room number',io.sockets.adapter.rooms);
		   });
		   
		  // 对message事件的监听
		  socket.on('message', function(msg){
				//取当前实例所在房间
				for(var a in socket.rooms){
				 io.sockets.to(socket.rooms[a]).emit('message',getMessage(client,msg));
				}
			});
			//监听出退事件
		  socket.on('disconnect', function () {  
			  var obj = {
				time:getTime(),
				color:client.color,
				username:'系统消息',
				text:client.name+' 已经退出',
			  };
			  // 广播用户已退出
			 // socket.broadcast.emit('userleft',obj);
			  //广播用户数量
			  --numUsers;
			  io.sockets.to().emit('system',obj);
			  io.sockets.emit('totalusernums','总共'+numUsers+'个用户');
			  console.log(obj.text);
			});
		
		  socket.on('error', function (err) { 	
				console.error(err.stack); // TODO, cleanup 
			});
		
		});		
		}
	};
module.exports=sockets;