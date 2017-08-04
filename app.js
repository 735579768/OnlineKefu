/**
 * 简单的在线管客服系统
 * http://127.0.0.1:4000/admin.html
 * http://127.0.0.1:4000/room/666666
 */
var //connect = require('connect'),
    express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    bodyParser = require('body-parser'),
    cookie = require('cookie'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    MemoryStore = session.MemoryStore,
    sessionStore = new MemoryStore();

const COOKIE_SECRET = 'secret',
    COOKIE_KEY = 'connect.sid';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));

/************输出页面**************************/
app.set('views', './views');
//app.set('view engine', 'ejs');
//开发时改变后缀
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
//app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    store: sessionStore,
    secret: 'secret',
    key: 'connect.sid',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 7 * 24 * 3600,
        expires: new Date(Date.now() + 1000 * 3600)
    }
}));
require('./globalvar.js')


//使io支持session
io.use(function(socket, next) {
    var data = socket.handshake || socket.request;
    if (data.headers.cookie) {
        data.cookie = cookie.parse(data.headers.cookie);
        data.sessionID = cookieParser.signedCookie(data.cookie[COOKIE_KEY], COOKIE_SECRET);
        data.sessionStore = sessionStore;
        sessionStore.get(data.sessionID, function(err, session) {
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
});



app.get('/room/:id?', function(request, response, next) {
    //如果是管理员直接进入后台管理
    if (request.session['islogin']) {
        response.redirect('/admin.html')
    }

    //一天后过期
    var hour = 3600000 * 24
    request.session.cookie.expires = new Date(Date.now() + hour)
    request.session.cookie.maxAge = hour
        // response.setHeader('Set-Cookie', serialize('isVisit', '1', { expires: 3600, maxAge: 600000 }));
    var id = request.params.id;
    //查找是否有这个房间
    var sql = "SELECT * from kl_kefu where room_id='" + id + "'";
    db.query(sql, function(err, rows, fields) {
        if (err) throw err;
        if (rows.length > 0) {
            request.session['room_id'] = id;
            response.render('chat', {
                room_id: id
            });
        } else {
            response.send('room no fount!');
        }
    });
});
// 指定webscoket的客户端的html文件
//打开指定的房间
//前台客户
app.get('/login.html', function(request, response, next) {
    if (request.session['islogin']) {
        response.redirect('/admin.html')
    }
    response.render('login', {
        title: 'Hey',
        message: 'Hello there!'
    });
});


app.get('/logout.html', function(request, response, next) {
    request.session['islogin'] = false;
    request.session['username'] = null;
    request.session['nickname'] = null;
    request.session['kefu_id'] = null;
    request.session['room_id'] = null;
    //一天后过期
    var hour = -3600000 * 24
    request.session.cookie.expires = new Date(Date.now() + hour)
    request.session.cookie.maxAge = hour
    response.redirect('/login.html')
});

app.post('/login.html', function(request, response, next) {
    var username = filtersql(request.body.username);
    var password = filtersql(request.body.password);
    if (request.session['islogin']) {
        response.redirect('/admin.html')
    }
    var sql = "SELECT * from kl_kefu where username='" + username + "' and password='" + password + "'";
    //查询数据库中的用户名密码
    db.query(sql, function(err, rows, fields) {
        if (err) throw err;
        if (rows.length > 0) {
            request.session['islogin'] = true;
            request.session['username'] = rows[0]['username'];
            request.session['nickname'] = rows[0]['name'];
            request.session['kefu_id'] = rows[0]['kefu_id'];
            request.session['room_id'] = rows[0]['room_id'];

            // request.session.cookie['nickname'] = rows[0]['name'];

            //一天后过期
            var hour = 3600000 * 24
            request.session.cookie.expires = new Date(Date.now() + hour)
            request.session.cookie.maxAge = hour
            var mycookes = {
                'username': request.session['username'],
                'kefu_id': request.session['kefu_id'],
                'nickname': request.session['nickname'],
                'room_id': request.session['room_id']
            };
            debug(mycookes);
            //设置cookie
            for (var i in mycookes) {
                response.cookie(i, mycookes[i], {
                    expires: new Date(Date.now() + 3600 * 1000 * 24),
                    httpOnly: true
                });
            }　
            //response.writeHead(200);
            // response.redirect('/admin.html');
            sessionid = request.sessionID;
            console.log(sessionid);
            response.render('admin', {
                room_id: request.session['room_id'],
                nickname: request.session['nickname'],
                kefu_id: request.session['kefu_id'],
                username: request.session['username']
            });
        } else {
            request.session['islogin'] = false;
            response.redirect('/login.html')
        }
    });


});

app.get('/admin.html', function(request, response, next) {
    if (!request.session['islogin']) {
        response.redirect('/login.html')
    } else {
        sessionid = request.sessionID;
        console.log(sessionid);
        response.render('admin', {
            room_id: request.session['room_id'],
            nickname: request.session['nickname'],
            kefu_id: request.session['kefu_id'],
            username: request.session['username']
        });
    }

});
app.get('/', function(request, response, next) {

    //每次刷新请求会自己生成一个新的session,如果不加下面代码并不会生成一个新的session
    //request.session.regenerate(function(err) {
    //
    //});
    response.send('');
});

app.all('*', function(request, response) {
    response.send('404 error');
});


var sockets = require('./sockets.js')
sockets.run(io);

http.listen(4000, function() {
    console.log('Server is started: http://127.0.0.1: 4000');
});
