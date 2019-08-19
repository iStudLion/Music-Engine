var youtube = {
    key: config.API.youtube.key,
    search: function(query, options = null) {
        if(typeof options != "object") throw "Invalid options type, options must be an object";
        if(typeof options.success != "function" && typeof options.success != "undefined") throw "Callback success needs to be a function";
        if(typeof options.error != "function" && typeof options.error != "undefined") throw "Callback error needs to be a function";
        if(typeof options.always != "function" && typeof options.always != "undefined") throw "Callback always needs to be a function";
        if(typeof options.progress != "function" && typeof options.progress != "undefined") throw "Callback progress needs to be a function";

        var finalOptions = {};
        if(typeof query != "string") throw "A valid query is required to search for a video";
        finalOptions.q = query;
        if(typeof options.max == "number") finalOptions.maxResults = options.max;
        if(typeof options.fields == "string" && options.fields.length > 0) finalOptions.fields = options.fields;
        finalOptions.part = typeof options.part == "string" && options.part.length > 0 ? options.part : "snippet";
        if(typeof options.type == "string" && options.type.length > 0) finalOptions.type = options.type;
        if(typeof options.categoryId == "number") finalOptions.videoCategoryId = options.categoryId;
        finalOptions.key = this.key;

        $.ajax("https://www.googleapis.com/youtube/v3/search", {
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
    },
    getVideo: function(id, callback) {
        if(typeof callback != "function") throw "Callback needs to be an function";
        youtubeInfo(id, function(err, res) {
            if(err) {
                callback({type:"error", response: err});
            } else {
                callback({type:"success", response: res});
            }
        });
    },
    getChannel: function(query, options = {}) {
        // options { id=false, max, fields, part, callback, fail, always }
    },
    getTrending: function(options = {}) {
        if(typeof options != "object") throw "Invalid options type, options must be an object";
        if(typeof options.success != "function" && typeof options.success != "undefined") throw "Callback success needs to be a function";
        if(typeof options.error != "function" && typeof options.error != "undefined") throw "Callback error needs to be a function";
        if(typeof options.always != "function" && typeof options.always != "undefined") throw "Callback always needs to be a function";
        if(typeof options.progress != "function" && typeof options.progress != "undefined") throw "Callback progress needs to be a function";

        var finalOptions = {};
        if(typeof options.max == "number") finalOptions.maxResults = options.max;
        if(typeof options.fields == "string" && options.fields.length > 0) finalOptions.fields = options.fields;
        finalOptions.part = typeof options.part == "string" && options.part.length > 0 ? options.part : "snippet";
        finalOptions.chart = "mostPopular";
        finalOptions.videoCategoryId = 10;
        finalOptions.key = this.key;

        // https://www.googleapis.com/youtube/v3/videos
        // ?part=snippet%2CcontentDetails%2Cstatistics
        // &fields=items%2Fkind%2Citems%2Fid%2Citems%2Fsnippet%2FpublishedAt%2Citems%2Fsnippet%2Ftitle%2Citems%2Fsnippet%2Fthumbnails%2Fdefault%2Furl%2Citems%2Fsnippet%2Fthumbnails%2Fmedium%2Furl%2Citems%2Fsnippet%2Fthumbnails%2Fhigh%2Furl%2Citems%2Fsnippet%2FchannelTitle%2Citems%2FcontentDetails%2Fduration%2Citems%2Fstatistics%2FviewCount
        // &maxResults=50
        // &chart=mostPopular
        // &regionCode=US
        // &videoCategoryId=10
        // &key=AIzaSyBpjRF-I-b2MrGCCHsNruTRlqPxpQh-GaU
        
        $.ajax("https://www.googleapis.com/youtube/v3/videos", {
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
    },
    parseDuration: function(duration, seconds = false) {
        if(seconds == true) {
            var sec_num = parseInt(duration, 10)
            var hours   = Math.floor(sec_num / 3600)
            var minutes = Math.floor(sec_num / 60) % 60
            var seconds = sec_num % 60
        
            return [hours,minutes,seconds]
                .map(v => v < 10 ? "0" + v : v)
                .filter((v,i) => v !== "00" || i > 0)
                .join(":")
        } else {
            var hour = /\d*H/.exec(duration);
            var min = /\d*M/.exec(duration);
            var sec = /\d*S/.exec(duration);
            return secondLayerParser(hour , min , sec);
            function secondLayerParser( h , m , s){
                var hour="" , min="" , sec="" ;
                if(h) hour = /\d*/.exec(h)[0]+":";
                else hour = "";
                if(m){
                    min = /\d*/.exec(m)[0];
                    if(min.length === 1) min = "0"+min;
                }
                else min = "00";
                if(s){
                    sec = /\d*/.exec(s)[0];
                    if(sec.length === 1) sec = "0"+sec;
                } else sec = "00";
                return hour+min+":"+sec;
            }
        }
    }//,
    // newSearch: function(query, options = {}) {
    //     if(typeof options != "object") throw "Invalid options type, options must be an object";
    //     if(typeof options.success != "function" && typeof options.success != "undefined") throw "Callback success needs to be a function";
    //     if(typeof options.error != "function" && typeof options.error != "undefined") throw "Callback error needs to be a function";
    //     if(typeof options.always != "function" && typeof options.always != "undefined") throw "Callback always needs to be a function";

    //     data = {};
    //     data.search_query = query;
    //     if(typeof options.page == "number") data.page = options.page;
    //     if(typeof options.filter == "string") {
    //         filter = {"any" : "CAA%253D", "video" : "EgIQAQ%253D%253D", "channel" : "EgIQAg%253D%253D", "playlist" : "EgIQAw%253D%253D", "movie" : "EgIQBA%253D%253D", "show" : "EgIQBQ%253D%253D"};
    //         if(filter[options.filter]) data.sp = filter[options.filter];
    //     }

    //     https.get('https://www.youtube.com/results?'+$.param(data), (res) => {
    //         const { statusCode } = res;
    //         if(statusCode != 200) {
    //             error = new Error('Request Failed.\n' +
    //             `Status Code: ${statusCode}`);
    //             console.error(error.message);
    //             res.resume();
    //             return;
    //         }

    //         res.setEncoding('utf8');
    //         let html = '';
    //         res.on('data', (chunk) => { html += chunk; });

    //         res.on('end', () => {
    //             // extract data from body
    //             $(html).
    //         });
    //     }).on("error", (err) => {
    //         console.log("Error: " + err.message);
    //     });
    // }
};

keybinds.add([{ "keyCode": 13 }, { "keyCode": 13, shift: true }], function () {
    if($("input#search").is(':focus')) {
        if($("input#search").val().length > 0) {
            youtube.search($("input#search").val(), {
				max: 50,
                part: "snippet",
                type: "video",
                categoryId: 10,
                fields: "nextPageToken,items/id/kind,items/id/videoId,items/snippet/publishedAt,items/snippet/title,items/snippet/thumbnails/default/url,items/snippet/thumbnails/medium/url,items/snippet/thumbnails/high/url,items/snippet/channelTitle",
                success: function(data) {
                    if(typeof data.items != "undefined") {
                        $("div.videos").empty();
                        for(var i = 0; i < data.items.length; i++) {
                            let item = data.items[i];
                            var video = {
                                id: item.id.videoId,
                                thumbnail: item.snippet.thumbnails.high.url ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.medium.url ? item.snippet.thumbnails.medium.url : item.snippet.thumbnails.default.url ? item.snippet.thumbnails.default.url : "data:image/jpeg;base64,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4DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44DvYOCZVclbMmLcrp44ZVclbMmLcrp44D4yAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//Z",
                                title: item.snippet.title,
                                time: timeAgo(item.snippet.publishedAt),
                                channelTitle: item.snippet.channelTitle
                            }

                            $("div.videos").append("<div class=\"video\" videoId=\""+video.id+"\"><div class=\"img thumbnail\" style=\"background-image: url("+video.thumbnail+");\"><span class=\"duration\">0:00</span></div><p class=\"title\">"+video.title+"</p><div class=\"details\"><p class=\"channel\">"+video.channelTitle+"</p><p class=\"time\">"+video.time+" - <span class=\"views\">0 Views</span></p></div></div>");
                            youtube.getVideo(item.id.videoId, function(res) {
                                if(res.type == "success") {
                                    $("div.video[videoId="+res.response.videoId+"] div.img.thumbnail span.duration").text(youtube.parseDuration(res.response.duration, true));
                                    $("div.video[videoId="+res.response.videoId+"] p span.views").text(abbreviateNumber(res.response.views)+ " Views");
                                }
                            });
                        }
                    }
                }
            });
        }
    }
});