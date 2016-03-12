//引入程序包
var express = require('express'),

    path = require('path'),
    // , rooms= require('./rooms.js')
    parseurl = require('parseurl'),
    session = require('express-session'),
    sessionStore = new session.MemoryStore({ reapInterval: 60000 * 10 }),
    cookieParser = require('cookie-parser'), //如果要使用cookie，需要显式包含这个模块
    bodyParser = require('body-parser'),
    app = express(),
    cookie = require('cookie'),
    http = require('http').Server(app),
    io = require('socket.io')(http);

const COOKIE_SECRET = 'secret',
    COOKIE_KEY = 'express.sid';

//数据库连接
var db = require('mysql');
var conn = db.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'adminrootkl',
    database: 'onlinekefu'
});
conn.connect();

//客户端服务器IP/端口
var clientip = 'http://127.0.0.1:4000';
//引入全局变量
require('./globalvar.js')


// 设置 Cookie
app.use(cookieParser('ankcc_'));
//app.use(cookieParser())
/************添加session支持**************************/
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    key: 'express.sid',
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 3600 }
}));
/*app.use(function(req, res, next) {
    var views = req.session.views
    if (!views) {
        views = req.session.views = {}
    }
    // get the url pathname
    var pathname = parseurl(req).pathname
        // count the views
    views[pathname] = (views[pathname] || 0) + 1
    next()
});*/

/*********取post参数时使用*******/
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

/************输出页面**************************/
app.set('views', './views');
//app.set('view engine', 'ejs');
//开发时改变后缀
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'public')));




/*io.use(function(socket, next) {
    var data = socket.handshake || socket.request;
    if (data.headers.cookie) {
        data.cookie = cookie.parse(data.headers.cookie);
        data.sessionID = cookieParser.signedCookie(data.cookie[COOKIE_KEY], COOKIE_SECRET);
        data.sessionStore = sessionStore;
        sessionStore.get(data.sessionID, function (err, session) {
            if (err || !session) {
                return next(new Error('session not found'))
            } else {
                data.session = session;
                data.session.id = data.sessionID;
                next();
            }
        });
    } else {
        return next(new Error('Missing cookie headers'));
    }
});*/
// 指定webscoket的客户端的html文件
//打开指定的房间
//前台客户
app.get('/room/:id?', function(req, res, next) {
    //设置cookies
    res.setHeader('Set-Cookie', serialize('isVisit', '1', { expires: 3600, maxAge: 600000 }));
    var id = req.params.id;
    //查找是否有这个房间
    var sql = "SELECT * from kl_kefu where room_id='" + id + "'";
    conn.query(sql, function(err, rows, fields) {
        if (err) throw err;
        if (rows.length > 0) {
            res.render('chat', { serverip: clientip, room_id: id });
        } else {
            res.send('error');
        }
    });
});

app.get('/chat.html', function(req, res, next) {
    res.send('error');
});


app.get('/login.html', function(req, res, next) {
    if (req.session['islogin']) {
        res.redirect('/admin.html')
    }
    res.render('login', { serverip: clientip, title: 'Hey', message: 'Hello there!' });
});


app.get('/logout.html', function(req, res, next) {
    req.session['islogin'] = false;
    req.session['username'] = null;
    req.session['nickname'] = null;
    req.session['kefu_id'] = null;
    req.session['room_id'] = null;
    res.redirect('/login.html')
});

app.post('/login.html', function(req, res, next) {
    var username = filtersql(req.body.username);
    var password = filtersql(req.body.password);
    if (req.session['islogin']) {
        res.redirect('/admin.html')
    }
    var sql = "SELECT * from kl_kefu where username='" + username + "' and password='" + password + "'";
    //查询数据库中的用户名密码
    conn.query(sql, function(err, rows, fields) {
        if (err) throw err;
        if (rows.length > 0) {
            req.session['islogin'] = true;
            req.session['username'] = rows[0]['username'];
            req.session['nickname'] = rows[0]['name'];
            req.session['kefu_id'] = rows[0]['kefu_id'];
            req.session['room_id'] = rows[0]['room_id'];
            var mycookes = [
                'username=' + req.session['username'],
                'kefu_id=' + req.session['kefu_id'],
                'nickname=' + req.session['nickname'],
                'room_id=' + req.session['room_id']
            ];
            res.setHeader('Set-Cookie', serialize('username', req.session['username']));
            /*            res.setHeader('Set-Cookie',serialize('nickname',req.session['nickname']));
                        res.setHeader('Set-Cookie',serialize('kefu_id',req.session['kefu_id']));
                        res.setHeader('Set-Cookie',serialize('room_id',req.session['room_id']));*/
            　 //res.writeHead(200);
            res.redirect('/admin.html');
        } else {
            req.session['islogin'] = false;
            res.redirect('/login.html')
        }
    });


});

app.get('/admin.html', function(req, res, next) {
    if (!req.session['islogin']) {
        res.redirect('/login.html')
    } else {
        sessionid = req.sessionID;
        console.log(sessionid);
        res.render('admin', {
            room_id: req.session['room_id'],
            nickname: req.session['nickname'],
            kefu_id: req.session['kefu_id'],
            username: req.session['username'],
            serverip: clientip
        });
    }

});
app.get('/', function(req, res, next) {

    //每次刷新请求会自己生成一个新的session,如果不加下面代码并不会生成一个新的session
    //req.session.regenerate(function(err) {
    //
    //});
    res.send('error');
});

app.all('*', function(req, res) {
    res.send('error');
});

var sockets = require('./sockets.js')
sockets.run(io);

http.listen(4000, function() {
    console.log('Server is started: http://127.0.0.1: 4000');
});
