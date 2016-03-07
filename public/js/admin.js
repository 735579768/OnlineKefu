
$(function () {
var chat_content = $('#chat_content');
var status = $('#status');
var input = $('#input');
var jihuorooms=$('#jihuorooms');
var myName = myinfo.myname;
var socket=null;
window.scrollbot=function(){
	var sh=chat_content[0].scrollHeight;
	var h=chat_content.height();
	chat_content.scrollTop(sh-h);
	};
window.joinroom=function(){
	var args=arguments;
	myinfo.roomid=args[0]?args[0]:1;
	myinfo.roomtitle=args[1]?args[1]:('聊天室ID:'+args[0]);
	socket.emit('join room',myinfo);
	};
window.disconn=function(){
	socket.disconnect();
	socket=null;
	status.text('未连接');
	};
window.chatconn=function(){
		if(socket)return;
			//建立websocket连接对象
		socket = io.connect('http://localhost:4000',{'force new connection': true});

		//收到server的连接确认
		socket.on('open',function(){
			status.text(myName+':连接成功,输入消息:');
			//进入指定客服聊天室id
			socket.emit('join room',myinfo);
		});

		//监听system事件，判断welcome或者disconnect，打印系统消息信息
		socket.on('system',function(json){
			var str = '';
			//if(myName==json.text) status.text(myName + ': ').css('color', json.color);
			//str = '<p style="color:'+json.color+'"> @ '+ json.time+ ' : 欢迎 ' + json.text +'</p>';
			str='<div class="sysmsg chat-message message-l"><div class="nickname" style="color:[COLOR];">[USERNAME]:@ <span class="message-time">[TIME]</span><div class="message-text" style="display:inline-block;"> [MESSAGE]</div> </div></div>';
			str=str.replace('[COLOR]','#f00');
			str=str.replace('[TIME]',json.time);
			str=str.replace('[MESSAGE]',json.text);
			str=str.replace('[USERNAME]','系统消息');
			chat_content.append(str);
			scrollbot();
		});

	    socket.on('userleft',function(json){
			str='<div class="chat-message message-l"><div class="nickname" style="color:[COLOR];">[USERNAME]:@ <span class="message-time">[TIME]</span></div><div class="message-text"> [MESSAGE]</div> </div>';
			str=str.replace('[COLOR]','#f00');
			str=str.replace('[TIME]',json.time);
			str=str.replace('[MESSAGE]',json.text);
			str=str.replace('[USERNAME]','系统消息');
			chat_content.append(str);
			scrollbot();
		});
		//监听message事件，打印消息信息
		socket.on('message',function(json){
			var str='';
			if(json.sid!=socket.id){
			str = '<div class="chat-message message-l"><div class="nickname" style="color:[COLOR];">[USERNAME]:@ <span class="message-time">[TIME]</span></div><div class="message-text"> [MESSAGE]</div> </div>';
			}else{
			str = '<div class="chat-message message-r"><div class="nickname" style="color:[COLOR];"><span class="message-time">[TIME]</span>@: [USERNAME]</div><div class="message-text"> [MESSAGE]</div> </div>';
					}
			str=str.replace('[COLOR]',json.color);
			str=str.replace('[TIME]',json.time);
			str=str.replace('[MESSAGE]',json.text);
			str=str.replace('[USERNAME]',json.username);
			chat_content.append(str);
			scrollbot();
		});

		socket.on('usernums',function(msg){
			$('#numusers').html(msg);
		});
		socket.on('totalusernums',function(num){
			$('#totalnumusers').html(num);
		});
		socket.on('username lists',function(obj){
			var str='';
			for(var a in obj){
				str+='<li><a href="javascript:;">'+obj[a]+'<span class="fr pdr10">在线</span></a></li>';
				}
			$('#friendlist').html(str);
		});
		socket.on('room number',function(obj){
			//console.log(obj);
			var str='';
			for(var a in obj){
				str+='<li><a href="javascript:;" onclick="joinroom(\''+a+'\');">'+a+'</a></li>';
				}
			jihuorooms.html(str);

		});
		socket.on('set roomtitle',function(msg){
			$('#roomtitle').html(myinfo.roomid+'：'+myinfo.roomtitle);
			});
		socket.on('debug',function(obj){
			console.log(obj);
		});
	};
	//通过“回车”提交聊天信息
	input.keydown(function(e) {
		if (e.keyCode === 13) {
			if(!socket){
				alert('没有连接');
				return false;
				}
			var msg = $(this).val();
			if (!msg) return;
			socket.emit('message',msg);
			$(this).val('');
		}
	});
chatconn();
});