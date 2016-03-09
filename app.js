//引入程序包
var express = require('express')
  , path = require('path')
 // , rooms= require('./rooms.js')
  , parseurl = require('parseurl')
  , session = require('express-session')
  , bodyParser = require('body-parser')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

  //数据库连接
 var db= require('mysql');
var conn = db.createConnection({
 host     : 'localhost',
 user     : 'root',
 password : 'adminrootkl',
 database : 'onlinekefu'
});
conn.connect();

 var port = process.env.PORT || 4000;

 //客户端服务器IP/端口
var clientip='http://127.0.0.1:4000';
//引入全局变量
require('./globalvar.js')

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

/************添加session支持**************************/
 app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000*3600 }
}));
app.use(function(req, res, next) {
   var views = req.session.views
  if (!views) {
    views = req.session.views = {}
  }
  // get the url pathname
  var pathname = parseurl(req).pathname
  // count the views
  views[pathname] = (views[pathname] || 0) + 1
  next()
});

/*********取post参数时使用*******/
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

/************输出页面**************************/
app.set('views','./views');
//app.set('view engine', 'ejs');
//开发时改变后缀
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'public')));
// 指定webscoket的客户端的html文件
//打开指定的房间

app.get('/room/:id?', function(req, res,next){
    var id=req.params.id;
  //查找是否有这个房间
  var sql="SELECT * from kl_kefu where room_id='"+id+"'";
          conn.query(sql, function(err, rows, fields) {
            if (err) throw err;
            if(rows.length>0){
                  res.render('chat',{serverip:clientip, room_id:id});
            }else{
                  res.send('error');
            }
      });
});
app.get('/chat.html', function(req, res,next){
  sessionid=req.sessionID;
  console.log(sessionid);
  res.render('chat',{serverip:clientip, title: 'Hey', message: 'Hello there!'});
});
app.get('/login.html', function(req, res,next){
    if(req.session['islogin']){
     res.redirect('/admin.html')
  }
  sessionid=req.sessionID;
  console.log(sessionid);
  res.render('login',{serverip:clientip, title: 'Hey', message: 'Hello there!'});
});


app.get('/logout.html', function(req, res,next){
      req.session['islogin']=false;
      req.session['username']=null;
      req.session['nickname']=null;
      req.session['kefu_id']=null;
      req.session['room_id']=null;
 res.redirect('/login.html')
});

app.post('/login.html', function(req, res,next){
  var username=req.body.username;
  var password=req.body.password;
  if(req.session['islogin']){
     res.redirect('/admin.html')
  }
  var sql="SELECT * from kl_kefu where username='"+username+"' and password='"+password+"'";
  //查询数据库中的用户名密码
        conn.query(sql, function(err, rows, fields) {
            if (err) throw err;
            if(rows.length>0){
              req.session['islogin']=true;
              req.session['username']=rows[0]['username'];
              req.session['nickname']=rows[0]['name'];
              req.session['kefu_id']=rows[0]['kefu_id'];
               req.session['room_id']=rows[0]['room_id'];
               res.redirect('/admin.html')
            }else{
             req.session['islogin']=false;
            res.redirect('/login.html')
            }
      });


});

app.get('/admin.html', function(req, res,next){
  if(!req.session['islogin']){
      res.redirect('/login.html')
    }else{
  sessionid=req.sessionID;
  console.log(sessionid);
  res.render('admin',{
                    room_id:req.session['room_id'],
                    nickname:req.session['nickname'],
                    kefu_id:req.session['kefu_id'],
                    username:req.session['username'],
                    serverip:clientip
  });
    }

});
app.get('/', function(req, res,next){

//每次刷新请求会自己生成一个新的session,如果不加下面代码并不会生成一个新的session
//req.session.regenerate(function(err) {
//
//});

  sessionid=req.sessionID;
  console.log(sessionid);
  res.render('chat',{serverip:clientip, title: 'Hey', message: 'Hello there!'});
});

app.all('*', function(req,res){
res.render('chat',{serverip:clientip, title: 'Hey', message: 'Hello there!'});
});

var sockets=require('./sockets.js')
sockets.run(io);


