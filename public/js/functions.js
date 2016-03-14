    window.writeCookie = function(name, value, hours) {
        var expire = "";
        if (hours != null) {
            expire = new Date(new Date().getTime() + hours * 36e5);
            expire = "; expires=" + expire.toGMTString();
        }
        document.cookie = name + "=" + escape(value) + expire;
    };

    ///////////////////////////////////////////////////////////////用cookies名字读它的值////////////////////////////
    window.readCookie = function(name) {
        var cookieValue = "";
        var search = name + "=";
        if (document.cookie.length > 0) {
            offset = document.cookie.indexOf(search);
            if (offset != -1) {
                offset += search.length;
                end = document.cookie.indexOf(";", offset);
                if (end == -1) end = document.cookie.length;
                cookieValue = unescape(document.cookie.substring(offset, end));
            }
        }
        return cookieValue;
    };