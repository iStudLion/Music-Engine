var genius = {
    key: config.API.genius.access_token,
    search: function(query, callbacks) {
        if(typeof callbacks.success != "function" && typeof callbacks.success != "undefined") throw "Callback success needs to be a function";
        if(typeof callbacks.error != "function" && typeof callbacks.error != "undefined") throw "Callback error needs to be a function";
        if(typeof callbacks.always != "function" && typeof callbacks.always != "undefined") throw "Callback always needs to be a function";
        if(typeof callbacks.progress != "function" && typeof callbacks.progress != "undefined") throw "Callback progress needs to be a function";

        $.ajax("https://api.genius.com/search", {
            method: "GET",
            dataType: "json",
            data: {
                q: query
            },
            headers: {
                Authorization: "Bearer "+this.key
            },
            xhr: function() {
                var xhr = new window.XMLHttpRequest();
                xhr.addEventListener("progress", function(evt){
                    if (evt.lengthComputable) {
                        if(typeof callbacks.progress != "undefined") {
                            callbacks.progress({
                                loaded: evt.loaded,
                                total: evt.total,
                                percent: evt.loaded / evt.total * 100
                            });
                        }
                    }
                }, false);
                return xhr;
            },
            success: function(data) {
                if(typeof callbacks.success != "undefined") callbacks.success(data);
                if(typeof callbacks.always != "undefined") callbacks.always(data);
            },
            error: function(data) {
                if(typeof callbacks.error != "undefined") callbacks.error(data);
                if(typeof callbacks.always != "undefined") callbacks.always(data);
            }
        });
    },
    getSong: function(id, callbacks) {
        if(this.key == null) throw "Genius is not ready";
        if(typeof callbacks.success != "function" && typeof callbacks.success != "undefined") throw "Callback success needs to be a function";
        if(typeof callbacks.error != "function" && typeof callbacks.error != "undefined") throw "Callback error needs to be a function";
        if(typeof callbacks.always != "function" && typeof callbacks.always != "undefined") throw "Callback always needs to be a function";
        if(typeof callbacks.progress != "function" && typeof callbacks.progress != "undefined") throw "Callback progress needs to be a function";

        $.ajax("https://api.genius.com/song/"+id, {
            method: "GET",
            headers: {
                Authorization: "Bearer "+this.key
            },
            xhr: function() {
                var xhr = new window.XMLHttpRequest();
                xhr.addEventListener("progress", function(evt){
                    if (evt.lengthComputable) {
                        if(typeof callbacks.progress != "undefined") {
                            callbacks.progress({
                                loaded: evt.loaded,
                                total: evt.total,
                                percent: evt.loaded / evt.total * 100
                            });
                        }
                    }
                }, false);
                return xhr;
            },
            success: function(data) {
                if(typeof callbacks.success != "undefined") callbacks.success(data);
                if(typeof callbacks.always != "undefined") callbacks.always(data);
            },
            error: function(data) {
                if(typeof callbacks.error != "undefined") callbacks.error(data);
                if(typeof callbacks.always != "undefined") callbacks.always(data);
            }
        });
    }
};