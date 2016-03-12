if(typeof(console)=='undefined'){
	window.console=function(){};
}
$(function () {
var chat_content = $('#chat_content');
var status = $('#status');
var msg_input = $('#msg_input');
var jihuorooms=$('#jihuorooms');
var myName = myinfo.nickname;
var socket=null;
window.setkefu=function(id){
	socket.emit('set kefu',id);
};
window.scrollbot=function(){
	var sh=chat_content[0].scrollHeight;
	var h=chat_content.height();
	chat_content.scrollTop(sh-h);
	};
window.joinroom=function(){
	if(!socket.connected){
		alert('连接已经断开,请刷新!');
		return;
	}
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
window.sendmsg=function(){
	if(!socket.connected){
		alert('连接已经断开,请刷新!');
		return;
	}
	var msg = msg_input.val();
	if (!msg) return;
	var data={'id':'','msg':msg};
	socket.emit('message',$.toJSON(data));
	msg_input.val('');
};
window.chatconn=function(){
		if(socket)return;
			//建立websocket连接对象
		//socket = io.connect('http://localhost:3000',{'force new connection': true});
		socket = io();

		//收到server的连接确认
		socket.on('open',function(){
			status.text(myName+':连接成功,输入消息:');
			//进入指定客服聊天室id
			socket.emit('join room',myinfo);
		});
		//监听message事件，打印消息信息
		socket.on('message',function(json){
			var str='';
			if(json.sid!='/#'+socket.id){
			str = '<div class="chat-message message-l"><div class="nickname" style="color:[COLOR];">[USERNAME]:@ <span class="message-time">[TIME]</span></div><div class="message-text"> [MESSAGE]</div> </div>';
			}else{
			str = '<div class="chat-message message-r"><div class="nickname" style="color:[COLOR];"><span class="message-time">[TIME]</span>@: [USERNAME]</div><div class="message-text"> [MESSAGE]</div> </div>';
					}
			str=str.replace('[COLOR]',json.color);
			str=str.replace('[TIME]',json.time);
			str=str.replace('[MESSAGE]',json.text);
			str=str.replace('[USERNAME]',json.nickname);
			chat_content.append(str);
			scrollbot();
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
		socket.on('debug',function(obj){
			console.log(obj);
		});
		socket.on('set kefu',function(){
			myinfo['kefuid']=id;
		});
		socket.on('select kefu',function(obj){
			var str = '';
			var kf='<span class="selectkefu"><span>请选择客服：</span>';
			for(i in obj.text){
				kf+='<a href="javascript:;" onclick="setkefu(\''+obj.text[i]['id']+'\')">'+obj.text[i]['name']+'</a>';
			}
			kf+='</span>';
			//if(myName==json.text) status.text(myName + ': ').css('color', json.color);
			//str = '<p style="color:'+json.color+'"> @ '+ json.time+ ' : 欢迎 ' + json.text +'</p>';
			str='<div class="sysmsg chat-message message-l"><div class="nickname" style="color:[COLOR];">[USERNAME]:@ <span class="message-time">[TIME]</span><div class="message-text" style="display:inline-block;"> [MESSAGE]</div> </div></div>';
			str=str.replace('[COLOR]','#f00');
			str=str.replace('[TIME]',obj.time);
			str=str.replace('[MESSAGE]',kf);
			str=str.replace('[USERNAME]','系统消息');
			chat_content.append(str);
			scrollbot();
		});
	};
	//通过“回车”提交聊天信息
/*	msg_input.keydown(function(e) {
		if (e.keyCode === 13) {
			if(!socket){
				alert('没有连接');
				return false;
				}
			var msg = $(this).val();
			if (!msg) return;
			var data={'id':'','msg':msg};
			socket.emit('message',$.toJSON(data));
			$(this).val('');
		}
	});*/
chatconn();
});