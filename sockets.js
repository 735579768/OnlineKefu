var debug = function(obj) {
    console.log("-------------------------------------------------------------")
    console.log(obj);
    //io.sockets.emit('debug',obj);
};

rooms = new socketrooms();
console.log(rooms);
var sockets = {
    run: function(io) {
        var _this = this;
        var numUsers = 0;
        var clientLists = {};
        //返回当前房间所有用户
        var sendalluser = function(roomid) {

            //查询用户名列表
            var userlist = [];
            var clients = rooms.getallclient(roomid);
            for (var a in clients) {
                //console.log(a);
                var o = clients[a];
                userlist.push({
                    'id': o.socketid,
                    'name': o.nickname
                });
            }
            var onlinekefulist = rooms.getallonlinekefu(roomid);
            for (i in onlinekefulist) {
                var soc = io.sockets.connected[onlinekefulist[i].socketid];
                sendmessage(soc, 'alluser', userlist);
            }
        };
        //返回当前客服里的用户
        var getkefuuserlist = function(roomid, kefuid) {
            //查询用户名列表
            var userlist = [];
            var clients = rooms.getallclient(roomid);
            for (var a in clients) {
                var o = clients[a];
                if (o.kefuid == kefuid) {
                    userlist.push({
                        'id': o.socketid,
                        'name': o.nickname
                    });
                }
            }
            return userlist;
        };
        var getusernums = function(roomid) {
            //更新加入房间的人数
            var romnum = 0;
            /*          for(var a in io.sockets.adapter.rooms[roomid]){
                                romnum++;
                            }*/
            var clients = rooms.getallclient(roomid);
            for (var a in clients) {
                romnum++;
            }
            return romnum;
        };
        //发送消息
        var sendmessage = function(socket, msgtype, msg) {
            if (socket) {
                socket.emit(msgtype, msg);
            } else {
                return false;
            }
        };
        //从数据库取客服列表
        var sendkefulist = function(soc, client) {
            db.query('SELECT * from kl_kefu limit 10', function(err, rows, fields) {
                if (err) throw err;
                var kefulist = [];
                var kefu2 = {};
                for (i in rows) {
                    kefulist.push({
                        'id': rows[i]['kefu_id'],
                        'name': rows[i]['name']
                    })
                    kefu2[rows[i]['kefu_id']] = {
                        'id': rows[i]['kefu_id'],
                        'name': rows[i]['name']
                    };
                }
                rooms.setkefulist(client.roomid, kefu2);
                sendmessage(soc, 'select kefu', getMessage(client, kefulist));
            });
        };
        //WebSocket连接监听
        io.on('connection', function(socket) {
            var session = socket.handshake.session;
            var cookie = socket.handshake.cookie;
            console.log(session);
            var client = {};
            if (session.islogin) {
                //客服
                socket.join(session.room_id); //加入房间
                client = {
                    sessionid: session.id, //会话sessionid
                    socketid: socket.id,
                    kefuid: session.kefu_id, //如果是客户会有一个客服的id
                    nickname: session.nickname, //当前客户端的名字
                    roomid: session.room_id, //当前房间号
                    color: getColor()
                }
                rooms.addkefu(client);
                var soc = io.sockets.connected[client.socketid];
                sendmessage(soc, 'system', getMessage(client, '成功登陆客服系统!'));
                sendmessage(soc, 'system', getMessage(client, '欢迎\'  ' + client.nickname + '  \'使用客服系统!'));
                sendmessage(soc, 'username lists', getkefuuserlist(client.roomid, client.kefuid));
                sendalluser(client.roomid);
            } else {
                //客户
                client = {
                    sessionid: session.id, //会话sessionid
                    socketid: socket.id,
                    kefuid: '', //如果是客户会有一个客服的id
                    nickname: '', //当前客户端的名字
                    roomid: '', //当前房间号
                    color: getColor()
                }

            }

            socket.emit('open');
            ++numUsers;
            //加入房间;
            socket.on('join room', function(myinfo) {
                //防止其它客服加入其它房间
                if (session.islogin) return false;

                //客户加入对应房间
                client.nickname = myinfo.nickname;
                var roomid = client.roomid = myinfo.roomid;
                socket.join(roomid);

                var soc = io.sockets.connected[client.socketid];
                rooms.addclient(client);
                sendmessage(soc, 'system', getMessage(client, '请问您有什么问题吗?'));
                try {
                    sendkefulist(soc, client);
                    //conn.end();
                } catch (e) {
                    console.log(e);
                }
                sendalluser(client.roomid);
                console.log('当前房间 ' + client.roomid + ' 用户' + rooms.getclientnums(client.roomid) + '个');
            });
            socket.on('set kefu', function(id) {
                try {
                    //为客户设置客服
                    //保存原来的客服id
                    var srckefuid = client.kefuid;
                    client.kefuid = id;
                    session['kefuid'] = id;
                    rooms.updateclient(client);

                    //取客服名字
                    var kefu = rooms.getkefubyid(client.roomid, id)
                    sendmessage(io.sockets.connected[client.socketid], 'system', getMessage(client, '您已选择客服 \'  ' + kefu.name + '  \' !'));
                    if (!rooms.isonline(client.roomid, id)) {
                        sendmessage(io.sockets.connected[client.socketid], 'system', getMessage(client, '当前客服 \'  ' + kefu.name + '  \' 离线 ! 请留言或请选择其它客服！'));
                    } else {
                        var socketid = rooms.getonlinekefubyid(client.roomid, id).socketid;
                        var soc = io.sockets.connected[socketid];
                        sendmessage(soc, 'system', getMessage(client, '客户' + client.nickname + '已经连接此客服!'));
                        sendmessage(soc, 'username lists', getkefuuserlist(client.roomid, client.kefuid));
                    }
                    //更新原来的客服id
                    if (srckefuid) {
                        var socketid = rooms.getonlinekefubyid(client.roomid, srckefuid).socketid;
                        var soc = io.sockets.connected[socketid];
                        sendmessage(soc, 'system', getMessage(client, '客户' + client.nickname + '已经离开!'));
                        sendmessage(soc, 'username lists', getkefuuserlist(client.roomid, srckefuid));
                    }
                } catch (e) {
                    console.log(e);
                }
            });
            // 对message事件的监听
            socket.on('message', function(msg) {
                msg = eval('(' + msg + ')');
                //msg=eval(msg);
                var khid = msg.id;
                msg = msg.msg;

                //提醒管理员选择一个客户进行回复
                if (session.islogin && !khid) {
                    sendmessage(io.sockets.connected[client.socketid], 'system', getMessage(client, '请选择一个客户!'));
                    return false;
                }
                //如果是管理员,对指定客户回复
                if (session.islogin) {
                    //回复给指定客户
                    sendmessage(io.sockets.connected[khid], 'message', getMessage(client, msg));
                    //对自己进行回复
                    var mesg = getMessage(client, msg);
                    mesg['khid'] = khid; //返回当前了天的客户socketid
                    sendmessage(io.sockets.connected[client.socketid], 'message', mesg);
                } else {
                    if (session.kefuid) {
                        if (rooms.isonline(client.roomid, client.kefuid)) {
                            //客服在线则转发给管理员
                            var socketid = rooms.getonlinekefubyid(client.roomid, client.kefuid).socketid;
                            var mesg = getMessage(client, msg);
                            mesg['khid'] = client.socketid; //返回当前正在了天的客户socketid方便把内容添加到对应的了天框中
                            sendmessage(io.sockets.connected[socketid], 'message', mesg);
                        } else {
                            //临时存到数据库
                        }
                    } else {
                        //提醒客户选择一个客服
                        sendkefulist(io.sockets.connected[client.socketid], client);
                        //sendmessage(io.sockets.connected[client.socketid],'select kefu',getMessage(client,sendkefulist()));
                    }
                    //对自己进行回复
                    sendmessage(io.sockets.connected[client.socketid], 'message', getMessage(client, msg));
                }

            });
            //监听出退事件
            socket.on('disconnect', function() {
                try {
                    var obj = {
                        time: getTime(),
                        color: client.color,
                        nickname: '系统消息',
                        text: client.nickname + ' 已经退出',
                        khid: client.socketid
                    };

                    if (session.islogin) {
                        rooms.deletekefu(client);
                    } else {
                        rooms.deleteclient(client);
                    }
                    //发送给管理员
                    if (!session.islogin && rooms.getonlinekefubyid(client.roomid, client.kefuid)) {
                        var socketid = rooms.getonlinekefubyid(client.roomid, client.kefuid).socketid;
                        var soc = io.sockets.connected[socketid];
                        sendmessage(soc, 'userleft', obj);
                        sendmessage(soc, 'username lists', getkefuuserlist(client.roomid, client.kefuid));

                        //sendmessage(soc,'usernums','当前'+getusernums(client.roomid)+'个用户');
                    } else {
                        //如果客服离线就通知当前客服下面的客户
                    }

                    sendalluser(client.roomid);
                    console.log(client.nickname + '离开');
                    console.log('当前网站在线客户' + rooms.getclientnums(client.roomid) + '个');
                } catch (e) {
                    console.log(e);
                }
            });

            socket.on('error', function(err) {
                console.error(err.stack); // TODO, cleanup
            });

        });
    }
};
module.exports = sockets;