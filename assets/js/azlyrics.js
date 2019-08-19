var azlyrics = {
    search: function(query, options) {
        if(typeof options != "object") throw "Invalid options type, options must be an object";
        if(typeof options.success != "function" && typeof options.success != "undefined") throw "Callback success needs to be a function";
        if(typeof options.error != "function" && typeof options.error != "undefined") throw "Callback error needs to be a function";
        if(typeof options.always != "function" && typeof options.always != "undefined") throw "Callback always needs to be a function";
        if(typeof options.progress != "function" && typeof options.progress != "undefined") throw "Callback progress needs to be a function";

        var finalOptions = {};
        finalOptions.q = query;
        
        $.ajax("https://search.azlyrics.com/search.php", {
            method: "GET",
            data: finalOptions,
            dataType: "html",
            xhr: function() {
              var xhr = new window.XMLHttpRequest();
              xhr.addEventListener("progress", function(evt){
                if (evt.lengthComputable) {
                    if(typeof options.progress != "undefined") {
                        options.progress({
                            loaded: evt.loaded,
                            total: evt.total,
                            percent: evt.loaded / evt.total * 50
                        });
                    }
                }
              }, false);
              return xhr;
            },
            success: function(data) {
                if($(data).find('div.panel table tr').length > 0) {
                    url = $(data).find('div.panel table tr td a:first').attr('href');

                    $.ajax("https://musicengine.co/azlyrics.php", {
                        method: "GET",
                        dataType: "html",
                        data: { url: url },
                        xhr: function() {
                          var xhr = new window.XMLHttpRequest();
                          xhr.addEventListener("progress", function(evt){
                            if (evt.lengthComputable) {
                                if(typeof options.progress != "undefined") {
                                    options.progress({
                                        loaded: evt.loaded,
                                        total: evt.total,
                                        percent: evt.loaded / evt.total * 50 + 50
                                    });
                                }
                            }
                          }, false);
                          return xhr;
                        },
                        success: function(data) {
                            lyrics = $($(data).find('div.row div div br').parent('div').get(0)).text();
                            if(typeof options.success != "undefined") options.success(lyrics);
                            if(typeof options.always != "undefined") options.always(lyrics);
                        },
                        error: function(data) {
                            if(typeof options.error != "undefined") options.error(data);
                            if(typeof options.always != "undefined") options.always(data);
                        }
                    });
                }
            },
            error: function(data) {
                if(typeof options.error != "undefined") options.error(data);
                if(typeof options.always != "undefined") options.always(data);
            }
        });
    }
};