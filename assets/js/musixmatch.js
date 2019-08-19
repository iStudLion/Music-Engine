var musixmatch = {
    key: config.API.musixmatch.key,
    search: function(query, options) {
        if(typeof options != "object") throw "Invalid options type, options must be an object";
        if(typeof options.success != "function" && typeof options.success != "undefined") throw "Callback success needs to be a function";
        if(typeof options.error != "function" && typeof options.error != "undefined") throw "Callback error needs to be a function";
        if(typeof options.always != "function" && typeof options.always != "undefined") throw "Callback always needs to be a function";
        if(typeof options.progress != "function" && typeof options.progress != "undefined") throw "Callback progress needs to be a function";

        var finalOptions = {};
        if(typeof options.max == "number") finalOptions.page_size = options.max;
        finalOptions.s_track_rating = "DESC"
        finalOptions.apikey = this.key;
        finalOptions.q = query;
        
        $.ajax("http://api.musixmatch.com/ws/1.1/track.search", {
            method: "GET",
            data: finalOptions,
            dataType: "json",
            xhr: function() {
              var xhr = new window.XMLHttpRequest();
              xhr.addEventListener("progress", function(evt){
                if (evt.lengthComputable) {
                    if(typeof options.progress != "undefined") {
                        options.progress({
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
                if(typeof options.success != "undefined") options.success(data);
                if(typeof options.always != "undefined") options.always(data);
            },
            error: function(data) {
                if(typeof options.error != "undefined") options.error(data);
                if(typeof options.always != "undefined") options.always(data);
            }
        });
    }
};