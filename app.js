//引入程序包
var express = require('express')
  , path = require('path')
  , db= require('mysql')
 // , rooms= require('./rooms.js')
  , parseurl = require('parseurl')
  , session = require('express-session')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);
 var port = process.env.PORT || 4000;
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

/************输出页面**************************/
app.set('views','./views');
//app.set('view engine', 'ejs');
//开发时改变后缀
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'public')));
// 指定webscoket的客户端的html文件
app.get('/room/:id?', function(req, res,next){
  res.send(req.params.id);
});
app.get('/chat.html', function(req, res,next){
  sessionid=req.sessionID;
  console.log(sessionid);
  res.render('chat',{ title: 'Hey', message: 'Hello there!'});
});
app.get('/login.html', function(req, res,next){
  sessionid=req.sessionID;
  console.log(sessionid);
  res.render('login',{ title: 'Hey', message: 'Hello there!'});
});
app.get('/admin.html', function(req, res,next){
  sessionid=req.sessionID;
  console.log(sessionid);
  res.render('admin',{ title: 'Hey', message: 'Hello there!'});
});
app.get('/', function(req, res,next){

//每次刷新请求会自己生成一个新的session,如果不加下面代码并不会生成一个新的session
//req.session.regenerate(function(err) {
//
//});

  sessionid=req.sessionID;
  console.log(sessionid);
  res.render('chat',{ title: 'Hey', message: 'Hello there!'});
});

app.all('*', function(req,res){
res.render('chat',{ title: 'Hey', message: 'Hello there!'});
});



//数据库连接
//var conn = db.createConnection({
//  host     : 'localhost',
//  user     : 'root',
//  password : 'adminrootkl',
//  database : 'ainiku'
//});
//conn.connect();
//conn.query('SELECT * from kl_picture limit 1', function(err, rows, fields) {
//  if (err) throw err;
//  console.log('The solution is: ', rows);
//});
//conn.end();
var sockets=require('./sockets.js')
sockets.run(io);


