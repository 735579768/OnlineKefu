var debug=function(obj){
	console.log("--------------------------------------------------------------")
	console.log(obj);
	 //io.sockets.emit('debug',obj);
	};
//数据库连接
 var db= require('mysql');
var conn = db.createConnection({
 host     : 'localhost',
 user     : 'root',
 password : 'adminrootkl',
 database : 'onlinekefu'
});
conn.connect();

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
			var userlist=[];
			var clients=rooms.getallclient(roomid);
			for(var a in clients){
				//console.log(a);
				var o=clients[a];
				userlist.push({'id':o.id,'name':o.name});
			}
			return userlist;
		};
		//返回当前客服里的用户
		var getkefuuserlist=function(roomid,kefuid){
		  	//查询用户名列表
			var userlist=[];
			var clients=rooms.getallclient(roomid);
			for(var a in clients){
				var o=clients[a];
				if(o.kefuid==kefuid){
					userlist.push({'id':o.socketid,'name':o.name});
				}
			}
			return userlist;
		};
		var getusernums=function(roomid){
			//更新加入房间的人数
			var romnum=0;
/*			for(var a in io.sockets.adapter.rooms[roomid]){
					romnum++;
				}*/
			var clients=rooms.getallclient(roomid);
			for(var a in clients){
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
		//从数据库取客服列表
		var sendkefulist=function(soc,client){
			conn.query('SELECT * from kl_kefu limit 10', function(err, rows, fields) {
			if (err) throw err;
			var kefulist=[];
			var kefu2={};
			for(i in rows){
				kefulist.push({'id':rows[i]['kefu_id'],'name':rows[i]['name']})
				kefu2[rows[i]['kefu_id']]={'id':rows[i]['kefu_id'],'name':rows[i]['name']};
			}
			rooms.setkefulist(client.roomid,kefu2);
			sendmessage(soc,'select kefu',getMessage(client,kefulist));
			});
		};
		//WebSocket连接监听
		io.on('connection', function (socket) {
		  // 构造客户端对象
		  var client = {
		  	kefuobj:null,//如果是客服会有客服的id和名字
			sessionid:sessionid,//会话sessionid
			socketid:socket.id,
			kefuid:'',//如果是客户会有一个客服的id
			name:'',//当前客户端的名字
			isadmin:0,//是否是客服
			roomtitle:'公共聊天大厅',
			roomid:'',//当前房间号
			color:getColor()
		  }
		  socket.emit('open');
		  ++numUsers;
		 //加入房间;
		  socket.on('join room',function(myinfo){
			socket.roomtitle=myinfo.roomtitle;
			socket.username=myinfo.myname;
			client.name=myinfo.myname;
			client.roomid=myinfo.roomid;
			client.roomtitle=myinfo.roomtitle;
			client.isadmin=myinfo.isadmin;
			client.kefuobj=myinfo.kefuobj;

			var roomid=myinfo.roomid;
			socket.join(roomid);

			var soc=io.sockets.connected[client.socketid];
			if(client.isadmin==1){
				rooms.addkefu(client);
				sendmessage(soc,'system',getMessage(client,'成功登陆客服系统!'));
				sendmessage(soc,'system',getMessage(client,'欢迎\'  '+client.name+'  \'使用客服系统!'));
				sendmessage(soc,'username lists',getkefuuserlist(client.roomid,client.kefuobj.id));
				//sendmessage(soc,'usernums','当前'+getusernums(roomid)+'个客户');
			}else{
				rooms.addclient(client);
				sendmessage(soc,'system',getMessage(client,'请问您有什么问题吗?'));
				try{
					sendkefulist(soc,client);
					//conn.end();
				}catch(e){
					console.log(e);
				}
			}
			console.log('当前用户'+rooms.getclientnums(client.roomid)+'个');
		   });
		socket.on('set kefu',function(id){
			//为客户设置客服
			//保存原来的客服id
			var srckefuid=client.kefuid;
			client.kefuid=id;
			rooms.updateclient(client);

			//取客服名字
			var kefu=rooms.getkefubyid(client.roomid,id)
			sendmessage(io.sockets.connected[client.socketid],'system',getMessage(client,'您已选择客服 \'  '+kefu.name+'  \' !'));
			if(!rooms.isonline(client.roomid,id)){
				sendmessage(io.sockets.connected[client.socketid],'system',getMessage(client,'当前客服 \'  '+kefu.name+'  \' 离线 ! 请留言或请选择其它客服！'));
			}else{
				var socketid=rooms.getonlinekefubyid(client.roomid,id).socketid;
				var soc=io.sockets.connected[socketid];
				sendmessage(soc,'system',getMessage(client,'客户'+client.name+'已经连接此客服!'));
				sendmessage(soc,'username lists',getkefuuserlist(client.roomid,client.kefuid));
			}

			//更新原来的客服id
			if(srckefuid){
				var socketid=rooms.getonlinekefubyid(client.roomid,srckefuid).socketid;
				var soc=io.sockets.connected[socketid];
				sendmessage(soc,'system',getMessage(client,'客户'+client.name+'已经离开!'));
				sendmessage(soc,'username lists',getkefuuserlist(client.roomid,srckefuid));
			}
		});
		  // 对message事件的监听
		  socket.on('message', function(msg){
		  		msg=eval('(' + msg + ')');
		  		//msg=eval(msg);
				var khid=msg.id;
		  		msg=msg.msg;

		  		//提醒管理员选择一个客户进行回复
		  		if(client.isadmin==1 && !khid){
		  			sendmessage( io.sockets.connected[client.socketid],'system',getMessage(client,'请选择一个客户!'));
		  			return false;
		  		}
				//如果是管理员,对指定客户回复
				if(client.isadmin==1){
					sendmessage(io.sockets.connected[khid],'message',getMessage(client,msg));
			  		//对自己进行回复
			  		var mesg=getMessage(client,msg);
			  		mesg['khid']=khid;//返回当前了天的客户socketid
			  		sendmessage(io.sockets.connected[client.socketid],'message',mesg);
				}else{
					if(client.kefuid){
						if(rooms.isonline(client.roomid,client.kefuid)){
							//客服在线则转发给管理员
							var socketid=rooms.getonlinekefubyid(client.roomid,client.kefuid).socketid;
							var mesg=getMessage(client,msg);
					  		mesg['khid']=client.socketid;//返回当前了天的客户socketid
							sendmessage( io.sockets.connected[socketid],'message',mesg);
						}else{
							//临时存到数据库
						}
					}else{
						//提醒客户选择一个客服
						sendkefulist(io.sockets.connected[client.socketid],client);
						//sendmessage(io.sockets.connected[client.socketid],'select kefu',getMessage(client,sendkefulist()));
					}
		  		//对自己进行回复
		  		sendmessage(io.sockets.connected[client.socketid],'message',getMessage(client,msg));
				}

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

				if(client.isadmin==1){
					rooms.deletekefu(client);
				}else{
					rooms.deleteclient(client);
				}
			  	//发送给管理员
			  	if(client.isadmin!=1 && rooms.getonlinekefubyid(client.roomid,client.kefuid)){
				  	var socketid=rooms.getonlinekefubyid(client.roomid,client.kefuid).socketid;
				  	var soc=io.sockets.connected[socketid];
				  	sendmessage(soc,'userleft',obj);
					sendmessage(soc,'username lists',getkefuuserlist(client.roomid,client.kefuid));
					//sendmessage(soc,'usernums','当前'+getusernums(client.roomid)+'个用户');
				}else{
				//如果客服离线就通知当前客服下面的客户
				}
			 console.log(client.name+'离开');
			  console.log('当前网站在线客户'+rooms.getclientnums(client.roomid)+'个');
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