start http://127.0.0.1:4000/admin.html
start http://127.0.0.1:4000/room/666666
cd /d %~d0
supervisor app.js
