
$(function () {
var chat_content = $('#chat_content');
var status = $('#status');
var msg_input = $('#msg_input');
var jihuorooms=$('#jihuorooms');
var myName = '客服';
var socket=null;

//了天框当前操作对象

window.setSocket=function(id,obj){
$('#friendlist a').removeClass('hover');
var _this=$(obj);
_this.addClass('hover');
var dataid=_this.attr('data');
//查找是不是有聊天框
var o=$('#admin_right .chat_message[data="'+dataid+'"]');
if(o.length>0){
	$('#admin_right .chat_message').hide();
	o.show();
}else{
	$('#admin_right .chat_message').hide();
	var str=''
	+'<div class="chat_message" data="'+dataid+'">'
	+'<div id="chat_content" class="chat_content g-bg msg-admin cl"></div>'
	+'<a href="javascript:;" class="btn fr" onclick="$(this).prev().html(\'\');">清屏</a><br>'
	+'<div class="sendmessage g-bg cl">'
	+'<a href="javascript:;" onClick="chatconn();" class="btn hide">连接</a>'
	+'<a href="javascript:;" onClick="disconn();" class="btn hide">断开连接</a>'
	+'<div  id="status">未连接</div>'
	+'<textarea type="text" class="form-control input-msg" id="msg_input"></textarea>'
	+'<input type="hidden" class="kehuid" id="khid" value="'+dataid+'" />'
	+'<a href="javascript:;" class="btn fr" onclick="sendmsg(this);">发送信息</a>'
	+'</div>'
	+'</div>';
	$('#admin_right').append(str);
}
//$('#khid').val(id);
};
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
window.sendmsg=function(obj){
	var _this=$(obj);
	var msgobj=_this.parents('.chat_message')
	var chat_contentobj=msgobj.find('.chat_content');
	var chat_msgobj=msgobj.find('.input-msg');
	var chat_kehuobj=msgobj.find('.kehuid');

	var msg = chat_msgobj.val();
	var socketid=chat_kehuobj.val();
	if (!msg) return;
	var data={'id':socketid,'msg':msg};
	socket.emit('message',$.toJSON(data));
	chat_msgobj.val('');
};
window.chatconn=function(){
		if(socket)return;
			//建立websocket连接对象
		//socket = io.connect('http://localhost:3000',{'force new connection': true});
		socket = io();

		//收到server的连接确认
		socket.on('open',function(){
			status.text(myName+':连接成功,输入消息:');
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
			str='<div class="sysmsg chat-message message-l"><div class="nickname" style="color:[COLOR];">[USERNAME]:@ <span class="message-time">[TIME]</span><div class="message-text" style="display:inline-block;"> [MESSAGE]</div> </div></div>';
			str=str.replace('[COLOR]','#f00');
			str=str.replace('[TIME]',json.time);
			str=str.replace('[MESSAGE]',json.text);
			str=str.replace('[USERNAME]','系统消息');
			chat_content.append(str);
			scrollbot();
		});
		//监听message事件，打印消息信息
		socket.on('message',function(json){
			var o=$('#admin_right .chat_message[data="'+json.khid+'"]');
			var chat_contentobj=o.find('.chat_content');
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
			chat_contentobj.append(str);
			scrollbot();
		});

		socket.on('usernums',function(msg){
			$('#numusers').html(msg);
		});

		socket.on('username lists',function(obj){
			var str='';
			for(var a in obj){
				str+='<li><a data="'+obj[a]['id']+'" onclick="setSocket(\''+obj[a]['id']+'\',this)" href="javascript:;">'+obj[a]['name']+'<span class="fr pdr10">在线</span></a></li>';
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
/*	msg_input.keydown(function(e) {
		if (e.keyCode === 13) {
			if(!socket){
				alert('没有连接');
				return false;
				}
			var msg = $(this).val();
			var socketid=$('#khid').val();
			if (!msg) return;
			var data={'id':socketid,'msg':msg};
			socket.emit('message',$.toJSON(data));
			$(this).val('');
		}
	});*/
chatconn();
});