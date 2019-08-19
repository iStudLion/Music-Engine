const ipc = require('electron').ipcRenderer;

var queue = {
    download: [],
    play: {
        previous: [],
        current: { id: null },
        next: []
    }
};

var audio = new Audio();
audio.onended = function() {
    $("body footer div.player div.controls svg[action=pause]").hide();
    $("body footer div.player div.controls svg[action=play]").attr("clickable", "false");
    $("body footer div.player div.controls svg[action=play]").show();

    play.next();
}

audio.onplay = function() {
    $("body footer div.player div.controls svg[action=play]").hide();
    $("body footer div.player div.controls svg[action=pause]").show();
};

audio.onpause = function() {
    $("body footer div.player div.controls svg[action=pause]").hide();
    $("body footer div.player div.controls svg[action=play]").show();
}

$("body footer div.player div.controls svg[action=pause]").click(function() {
    if(audio.src != "") {
        if(!audio.paused) audio.pause();
        else {
            $("body footer div.player div.controls svg[action=pause]").hide();
            $("body footer div.player div.controls svg[action=play]").show();
        }
    }
});

$("body footer div.player div.controls svg[action=play]").click(function() {
    if(audio.src != "") {
        if(audio.paused) audio.play();
        else {
            $("body footer div.player div.controls svg[action=play]").hide();
            $("body footer div.player div.controls svg[action=pause]").show();
        }
    }
});

$("body footer div.player div.controls svg[action=prev]").click(function() {
    play.previous();
});

$("body footer div.player div.controls svg[action=skip]").click(function() {
    play.next();
});

var musicEngine = {
    download: function(id, options) {
        if(typeof options != "object") throw "Options needs to be an object";
        if(typeof options.success != "undefined" && typeof options.success != "function") throw "Options success callback needs to be a function";
        if(typeof options.error != "undefined" && typeof options.error != "function") throw "Options error callback needs to be a function";
        if(typeof options.always != "undefined" && typeof options.always != "function") throw "Options always callback needs to be a function";
        if(typeof options.progress != "undefined" && typeof options.progress != "function") throw "Options progress callback needs to be a function";
        if(typeof options.start != "undefined" && typeof options.start != "function") throw "Options start callback needs to be a function";
        if(typeof options.finish != "undefined" && typeof options.finish != "function") throw "Options finish callback needs to be a function";

        let contents = {
            element: {
                span: null,
                downloadItem: null
            },
            meta: {
                album: {
                    cover: {
                        buffer: null,
                        url: null
                    },
                    name: null
                },
                artist: null,
                bitrate: 128,
                lyrics: null,
                genres: [],
                titles: {
                    title: null,
                    title_with_featured: null,
                    title_full: null
                },
                year: null,
            },
            methods: {
                pauseDownload: function() {},
                resumeDownload: function() {},
                isDownloadPaused: function() {},
                stopDownload: function() {}
            },
            progress: {
                general: {
                    start: time(),
                    finish: null
                },
                download: {
                    start: null,
                    finish: null,
                    size: {
                        downloaded: null,
                        total: null
                    }
                }
            },
            path: {
                temp: {
                    folder: tempFolder,
                    file: generateRandomId(32),
                    full_path: null
                },
                download: {
                    folder: downloadFolder,
                    file: null,
                    full_path: null
                }
            },
            trackerId: generateRandomId(32),
            videoId: id
        }

        $('body').append("<section class=\"modal\" style=\"cursor: progress; opacity: 0;\" trackerId=\""+contents.trackerId+"\" closeable=\"false\"></section>");

        youtube.getVideo(contents.videoId, function(res) {
            contents.meta.titles.title = res.response.title.replace(/( ?[\[\{\(] ?(?:(?:video|.*?remix|karaoke|lyrics?|.*?version.*?)? ?(?:off?icial)? ?(?:audio|(?:music|lyrics?)? ?video)?)[\]\)\}])/gi, '').replace(/[/\\:\*\?"<>\|]/g, '');
            contents.meta.album.cover.url = res.response.thumbnailUrl;
            contents.meta.artist = res.response.owner;
            contents.path.download.file = contents.meta.titles.title;

            musicEngine.datab64encode("https://api.musicengine.co/core/image.php?url="+res.response.thumbnailUrl+"&key=w}79g@dW/\$w](Py?", function(b64) {
                contents.meta.album.cover.url = b64 ? b64 : contents.meta.album.cover.url;
                if(contents.meta.album.cover.buffer == null && b64) {
                    img = b64.split(',', 2)[1];
                    contents.meta.album.cover.buffer = new Buffer.from(img, 'base64');
                }

                i = 0;
                while(fs.existsSync(path.resolve(path.join(contents.path.download.folder, contents.path.download.file + ".mp3")))) {
                    i++;
                    contents.path.download.file = contents.path.download.file+" ("+index+")";
                }
                delete i;
    
                musicEngine.search(contents.meta.titles.title, {
                    success: function(data) {
                        // get song information and open menu
                        if(data.meta.status == 200 && data.response.results > 0) {
                            // success & possible match found
                            const song = data.response.hits[0].song;
                            contents.meta.titles = song.titles;
                            contents.meta.album.cover.url = song.album.cover;
                            contents.meta.album.name = song.album.name ? song.album.name : null; 
                            contents.meta.artist = song.artist;
                            contents.meta.year = song.year ? song.year : null;
                            contents.meta.lyrics = song.lyrics ? song.lyrics : null
                            contents.path.download.file = song.titles.title_full || song.titles.title_with_featured || song.titles.title;
                            
                            $("section.modal[trackerId="+contents.trackerId+"]").append("<div class=\"contents\"><div class=\"w-35 h-100 left\"><div class=\"container download-left\"><p style=\"padding:8px 0;\">Audio Bit Rate</p><p class=\"my-1\" style=\"padding: 3px 0;\">File Name</p><p class=\"my-1\" style=\"padding: 9px 0;\">Directory</p><div class=\"img\" id=\"cover\" style=\"width: 200px; height: 200px; border-radius: 15px; margin-left: auto; margin-top: 27px; background-image: url("+(contents.meta.album.cover.url || "")+");background-size:contain;\"><div id=\"upload\"><i class=\"fa fa-upload\"></i></div></div></div></div><div class=\"w-65 h-100 right\"><div class=\"container download-right\"><select id=\"bitrate\"><option value=\"128\">128 KB/s</option><option value=\"258\" selected>258 KB/s</option><option value=\"384\">384 KB/s</option><option value=\"512\">512 KB/s</option></select><input id=\"filename\" class=\"block my-1 w-80\" placeholder=\"File Name...\" value=\""+(contents.meta.titles.title_full || contents.meta.titles.title_with_featured || contents.meta.titles.title)+"\"><input id=\"directory\" class=\"block my-1 w-80 cursor-pointer\" placeholder=\""+contents.path.download.folder+"\" readonly><input id=\"title\" class=\"block my-1 mt-2 w-40\" placeholder=\"Song Title...\" value=\""+contents.meta.titles.title+"\"><input id=\"album\" class=\"inline-block w-30 mr-1\" placeholder=\"Album Name...\" value=\""+(contents.meta.album.name || "")+"\"><input id=\"artist\" class=\"inline-block w-40\" placeholder=\"Main Artist...\" value=\""+contents.meta.artist+"\"><input id=\"year\" class=\"inline-block my-1 w-15 mr-1\" placeholder=\"Year...\" value=\""+(contents.meta.year || "")+"\"><select class=\"inline-block\" id=\"genre\"><option class=\"hidden\" value=\"\">Genre</option><option value=\"00\">Blues</option><option value=\"01\">Classic rock</option><option value=\"02\">Country</option><option value=\"03\">Dance</option><option value=\"04\">Disco</option><option value=\"05\">Funk</option><option value=\"06\">Grunge</option><option value=\"07\">Hip-Hop</option><option value=\"08\">Jazz</option><option value=\"09\">Metal</option><option value=\"10\">New Age</option><option value=\"11\">Oldies</option><option value=\"12\">Other</option><option value=\"13\">Pop</option><option value=\"14\">Rhythm and Blues</option><option value=\"15\">Rap</option><option value=\"16\">Reggae</option><option value=\"17\">Rock</option><option value=\"18\">Techno</option><option value=\"19\">Industrial</option><option value=\"20\">Alternative</option><option value=\"21\">Ska</option><option value=\"22\">Death metal</option><option value=\"23\">Pranks</option><option value=\"24\">Soundtrack</option><option value=\"26\">Ambient</option><option value=\"27\">Trip-Hop</option><option value=\"28\">Vocal</option><option value=\"29\">Jazz & Funk</option><option value=\"30\">Fusion</option><option value=\"31\">Trance</option><option value=\"32\">Classical</option><option value=\"33\">Instrumental</option><option value=\"34\">Acid</option><option value=\"35\">House</option><option value=\"36\">Game</option><option value=\"37\">Sound clip</option><option value=\"38\">Gospel</option><option value=\"39\">Noise</option><option value=\"40\">Alternative Rock</option><option value=\"41\">Bass</option><option value=\"42\">Soul</option><option value=\"43\">Punk</option><option value=\"44\">Space</option><option value=\"45\">Meditative</option><option value=\"47\">instrumental Rock</option><option value=\"48\">Ethnic</option><option value=\"49\">Gothic</option><option value=\"50\">Darkwave</option><option value=\"51\">techno-Industrial</option><option value=\"52\">Electronic</option><option value=\"53\">Pop-Folk</option><option value=\"54\">Eurodance</option><option value=\"55\">Dream</option><option value=\"56\">Southern Rock</option><option value=\"57\">Comedy</option><option value=\"58\">Cult</option><option value=\"59\">Gangsta</option><option value=\"60\">Top 40</option><option value=\"61\">Christian Rap</option><option value=\"62\">Pop/Funk</option><option value=\"63\">Jungle</option><option value=\"64\">Native US</option><option value=\"65\">Cabaret</option><option value=\"66\">New Wave</option><option value=\"67\">Psychedelic</option><option value=\"68\">Rave</option><option value=\"69\">Show tunes</option><option value=\"70\">Trailer</option><option value=\"71\">Lo-Fi</option><option value=\"72\">Tribal</option><option value=\"73\">Acid Punk</option><option value=\"74\">Acid Jazz</option><option value=\"75\">Polka</option><option value=\"76\">Retro</option><option value=\"77\">Musical</option><option value=\"78\">Rock ’n’ Roll</option><option value=\"79\">Hard Rock</option></select><textarea class=\"block w-80 resize-none\" id=\"lyrics\" rows=\"5\" placeholder=\"Lyrics...\">"+(contents.meta.lyrics || "")+"</textarea></div><div class=\"text-right mr-5\" id=\"actions\"><button class=\"mr-1\" action=\"cancel\">Cancel</button><button class=\"primary\" action=\"download\">Download</button></div></div></div>");
                        } else {
                            // error or no match found
                            $("section.modal[trackerId="+contents.trackerId+"]").append("<div class=\"contents\"><div class=\"w-35 h-100 left\"><div class=\"container download-left\"><p style=\"padding:8px 0;\">Audio Bit Rate</p><p class=\"my-1\" style=\"padding: 3px 0;\">File Name</p><p class=\"my-1\" style=\"padding: 9px 0;\">Directory</p><div class=\"img\" id=\"cover\" style=\"width: 200px; height: 200px; border-radius: 15px; margin-left: auto; margin-top: 27px; background-image: url("+(contents.meta.album.cover.url || "")+");background-size:contain;\"><div id=\"upload\"><i class=\"fa fa-upload\"></i></div></div></div></div><div class=\"w-65 h-100 right\"><div class=\"container download-right\"><select id=\"bitrate\"><option value=\"128\">128 KB/s</option><option value=\"258\" selected>258 KB/s</option><option value=\"384\">384 KB/s</option><option value=\"512\">512 KB/s</option></select><input id=\"filename\" class=\"block my-1 w-80\" placeholder=\"File Name...\" value=\""+(contents.meta.titles.title || "")+"\"><input id=\"directory\" class=\"block my-1 w-80 cursor-pointer\" placeholder=\""+contents.path.download.folder+"\" readonly><input id=\"title\" class=\"block my-1 mt-2 w-40\" placeholder=\"Song Title...\" value=\""+(contents.meta.titles.title || "")+"\"><input id=\"album\" class=\"inline-block w-30 mr-1\" placeholder=\"Album Name...\"><input id=\"artist\" class=\"inline-block w-40\" placeholder=\"Main Artist...\" value=\""+(contents.meta.artist || "")+"\"><input id=\"year\" class=\"inline-block my-1 w-15 mr-1\" placeholder=\"Year...\" value=\""+(contents.meta.year || "")+"\"><select class=\"inline-block\" id=\"genre\"><option class=\"hidden\" value=\"\">Genre</option><option value=\"00\">Blues</option><option value=\"01\">Classic rock</option><option value=\"02\">Country</option><option value=\"03\">Dance</option><option value=\"04\">Disco</option><option value=\"05\">Funk</option><option value=\"06\">Grunge</option><option value=\"07\">Hip-Hop</option><option value=\"08\">Jazz</option><option value=\"09\">Metal</option><option value=\"10\">New Age</option><option value=\"11\">Oldies</option><option value=\"12\">Other</option><option value=\"13\">Pop</option><option value=\"14\">Rhythm and Blues</option><option value=\"15\">Rap</option><option value=\"16\">Reggae</option><option value=\"17\">Rock</option><option value=\"18\">Techno</option><option value=\"19\">Industrial</option><option value=\"20\">Alternative</option><option value=\"21\">Ska</option><option value=\"22\">Death metal</option><option value=\"23\">Pranks</option><option value=\"24\">Soundtrack</option><option value=\"26\">Ambient</option><option value=\"27\">Trip-Hop</option><option value=\"28\">Vocal</option><option value=\"29\">Jazz & Funk</option><option value=\"30\">Fusion</option><option value=\"31\">Trance</option><option value=\"32\">Classical</option><option value=\"33\">Instrumental</option><option value=\"34\">Acid</option><option value=\"35\">House</option><option value=\"36\">Game</option><option value=\"37\">Sound clip</option><option value=\"38\">Gospel</option><option value=\"39\">Noise</option><option value=\"40\">Alternative Rock</option><option value=\"41\">Bass</option><option value=\"42\">Soul</option><option value=\"43\">Punk</option><option value=\"44\">Space</option><option value=\"45\">Meditative</option><option value=\"47\">instrumental Rock</option><option value=\"48\">Ethnic</option><option value=\"49\">Gothic</option><option value=\"50\">Darkwave</option><option value=\"51\">techno-Industrial</option><option value=\"52\">Electronic</option><option value=\"53\">Pop-Folk</option><option value=\"54\">Eurodance</option><option value=\"55\">Dream</option><option value=\"56\">Southern Rock</option><option value=\"57\">Comedy</option><option value=\"58\">Cult</option><option value=\"59\">Gangsta</option><option value=\"60\">Top 40</option><option value=\"61\">Christian Rap</option><option value=\"62\">Pop/Funk</option><option value=\"63\">Jungle</option><option value=\"64\">Native US</option><option value=\"65\">Cabaret</option><option value=\"66\">New Wave</option><option value=\"67\">Psychedelic</option><option value=\"68\">Rave</option><option value=\"69\">Show tunes</option><option value=\"70\">Trailer</option><option value=\"71\">Lo-Fi</option><option value=\"72\">Tribal</option><option value=\"73\">Acid Punk</option><option value=\"74\">Acid Jazz</option><option value=\"75\">Polka</option><option value=\"76\">Retro</option><option value=\"77\">Musical</option><option value=\"78\">Rock ’n’ Roll</option><option value=\"79\">Hard Rock</option></select><textarea class=\"block w-80 resize-none\" id=\"lyrics\" rows=\"5\" placeholder=\"Lyrics...\"></textarea></div><div class=\"text-right mr-5\" id=\"actions\"><button class=\"mr-1\" action=\"cancel\">Cancel</button><button class=\"primary\" action=\"download\">Download</button></div></div></div>");
                        }
                        // open menu
                        $("section.modal[trackerId="+contents.trackerId+"]").removeAttr("style");
                        $("section.modal[trackerId="+contents.trackerId+"]").removeAttr("closeable");
                    },
                    error: function() {
                        // open empty menu
                        $("section.modal[trackerId="+contents.trackerId+"]").append("<div class=\"contents\"><div class=\"w-35 h-100 left\"><div class=\"container download-left\"><p style=\"padding:8px 0;\">Audio Bit Rate</p><p class=\"my-1\" style=\"padding: 3px 0;\">File Name</p><p class=\"my-1\" style=\"padding: 9px 0;\">Directory</p><div class=\"img\" id=\"cover\" style=\"width: 200px; height: 200px; border-radius: 15px; margin-left: auto; margin-top: 27px; background-image: url("+(contents.meta.album.cover.url || "")+");background-size:contain;\"><div id=\"upload\"><i class=\"fa fa-upload\"></i></div></div></div></div><div class=\"w-65 h-100 right\"><div class=\"container download-right\"><select id=\"bitrate\"><option value=\"128\">128 KB/s</option><option value=\"258\" selected>258 KB/s</option><option value=\"384\">384 KB/s</option><option value=\"512\">512 KB/s</option></select><input id=\"filename\" class=\"block my-1 w-80\" placeholder=\"File Name...\" value=\""+(contents.meta.titles.title || "")+"\"><input id=\"directory\" class=\"block my-1 w-80 cursor-pointer\" placeholder=\""+contents.path.download.folder+"\" readonly><input id=\"title\" class=\"block my-1 mt-2 w-40\" placeholder=\"Song Title...\" value=\""+(contents.meta.titles.title || "")+"\"><input id=\"album\" class=\"inline-block w-30 mr-1\" placeholder=\"Album Name...\"><input id=\"artist\" class=\"inline-block w-40\" placeholder=\"Main Artist...\" value=\""+(contents.meta.artist || "")+"\"><input id=\"year\" class=\"inline-block my-1 w-15 mr-1\" placeholder=\"Year...\" value=\""+(contents.meta.year || "")+"\"><select class=\"inline-block\" id=\"genre\"><option class=\"hidden\" value=\"\">Genre</option><option value=\"00\">Blues</option><option value=\"01\">Classic rock</option><option value=\"02\">Country</option><option value=\"03\">Dance</option><option value=\"04\">Disco</option><option value=\"05\">Funk</option><option value=\"06\">Grunge</option><option value=\"07\">Hip-Hop</option><option value=\"08\">Jazz</option><option value=\"09\">Metal</option><option value=\"10\">New Age</option><option value=\"11\">Oldies</option><option value=\"12\">Other</option><option value=\"13\">Pop</option><option value=\"14\">Rhythm and Blues</option><option value=\"15\">Rap</option><option value=\"16\">Reggae</option><option value=\"17\">Rock</option><option value=\"18\">Techno</option><option value=\"19\">Industrial</option><option value=\"20\">Alternative</option><option value=\"21\">Ska</option><option value=\"22\">Death metal</option><option value=\"23\">Pranks</option><option value=\"24\">Soundtrack</option><option value=\"26\">Ambient</option><option value=\"27\">Trip-Hop</option><option value=\"28\">Vocal</option><option value=\"29\">Jazz & Funk</option><option value=\"30\">Fusion</option><option value=\"31\">Trance</option><option value=\"32\">Classical</option><option value=\"33\">Instrumental</option><option value=\"34\">Acid</option><option value=\"35\">House</option><option value=\"36\">Game</option><option value=\"37\">Sound clip</option><option value=\"38\">Gospel</option><option value=\"39\">Noise</option><option value=\"40\">Alternative Rock</option><option value=\"41\">Bass</option><option value=\"42\">Soul</option><option value=\"43\">Punk</option><option value=\"44\">Space</option><option value=\"45\">Meditative</option><option value=\"47\">instrumental Rock</option><option value=\"48\">Ethnic</option><option value=\"49\">Gothic</option><option value=\"50\">Darkwave</option><option value=\"51\">techno-Industrial</option><option value=\"52\">Electronic</option><option value=\"53\">Pop-Folk</option><option value=\"54\">Eurodance</option><option value=\"55\">Dream</option><option value=\"56\">Southern Rock</option><option value=\"57\">Comedy</option><option value=\"58\">Cult</option><option value=\"59\">Gangsta</option><option value=\"60\">Top 40</option><option value=\"61\">Christian Rap</option><option value=\"62\">Pop/Funk</option><option value=\"63\">Jungle</option><option value=\"64\">Native US</option><option value=\"65\">Cabaret</option><option value=\"66\">New Wave</option><option value=\"67\">Psychedelic</option><option value=\"68\">Rave</option><option value=\"69\">Show tunes</option><option value=\"70\">Trailer</option><option value=\"71\">Lo-Fi</option><option value=\"72\">Tribal</option><option value=\"73\">Acid Punk</option><option value=\"74\">Acid Jazz</option><option value=\"75\">Polka</option><option value=\"76\">Retro</option><option value=\"77\">Musical</option><option value=\"78\">Rock ’n’ Roll</option><option value=\"79\">Hard Rock</option></select><textarea class=\"block w-80 resize-none\" id=\"lyrics\" rows=\"5\" placeholder=\"Lyrics...\"></textarea></div><div class=\"text-right mr-5\" id=\"actions\"><button class=\"mr-1\" action=\"cancel\">Cancel</button><button class=\"primary\" action=\"download\">Download</button></div></div></div>");
                        $("section.modal[trackerId="+contents.trackerId+"]").removeAttr("style");
                        $("section.modal[trackerId="+contents.trackerId+"]").removeAttr("closeable");
                    },
                    always: function() {
                        let uploadImage = $("section.modal[trackerId="+contents.trackerId+"] div.contents div.left div.container div.img div#upload"),
                        cancel = $("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div#actions button[action=cancel]"),
                        download = $("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div#actions button[action=download]"),
                        directoryInput = $("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container input#directory"),
                        filenameInput = $("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container input#filename");
    
                        directoryInput.click(function() {
                            electron.remote.dialog.showOpenDialog({ properties: ['openDirectory']}, function(e) {
                                if(e.length > 0) {
                                    contents.path.download.folder = e[0];
                                    $("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container input#directory").attr("placeholder", e[0]);
    
                                    fs.readFile('assets/configs/config.json', function(err, data) {
                                        if(err) return;
    
                                        let config = JSON.parse(data);
                                        config.options.downloadPath = e[0];
                                        fs.writeFile('assets/configs/config.json', JSON.stringify(config, null, 2), function() {});
                                    });
                                    downloadFolder = e[0];
                                }
                            });
                        });
    
                        filenameInput.keypress(function(e) {
                            if(['/', '\\', ':', '*', '?', '"', '<', '>', '|'].includes(e.key)) e.preventDefault();
                        });
    
                        uploadImage.click(function() {
                            electron.remote.dialog.showOpenDialog({filters: [{name:"Images", extensions:["jpg", "jpeg", "png"]}], properties: ['openFile']}, function(e) {
                                if(e.length > 0) {
                                    contents.meta.album.cover.buffer = fs.readFileSync(e[0]);
                                    contents.meta.album.cover.url = "data:image/jpeg;base64,"+fs.readFileSync(e[0], { encoding: 'base64' });
                                    $('div.img#cover').css("background-image", "url("+contents.meta.album.cover.url+")");
                                }
                            });
                        });
    
                        cancel.click(function() {
                            $("section.modal[trackerId="+contents.trackerId+"] div.contents").slideUp('fast').fadeOut('slow', function() {
                                $("section.modal[trackerId="+contents.trackerId+"]").fadeOut('fast', function() {
                                    $(this).remove();
                                });
                            });
                        });
    
                        download.click(function() {
                            // download animation
                            $('body').append("<div class=\"img\" trackerId=\""+contents.trackerId+"\" style=\"position: absolute; width: 200px; height: 200px; z-index: 10; border-radius: 15px;\"></div>");
                            topPos = $("section.modal[trackerId="+contents.trackerId+"] div.contents div.left div.container div.img").offset().top + $("body div.img[trackerId="+contents.trackerId+"]").height()/2;
                            leftPos = $("section.modal[trackerId="+contents.trackerId+"] div.contents div.left div.container div.img").offset().left + $("body div.img[trackerId="+contents.trackerId+"]").width()/2
    
                            $("body div.img[trackerId="+contents.trackerId+"]").css({ "position": "absolute", "width": "200px", "height": "200px", "top": "50%", "left": "50%", "z-index": 10, "margin": "-100px 0px 0px -100px", "border-radius": "15px", "top": topPos, "left": leftPos, "background-image": $("section.modal[trackerId="+contents.trackerId+"] div.contents div.left div.container div.img").css("background-image") });
                            $("body div.img[trackerId="+contents.trackerId+"]").animate({ "width": "0px", "height": "0px", "top": $("nav i#download").offset().top + $("body div.img[trackerId="+contents.trackerId+"]").height()/2, "left": $("nav i#download").offset().left+$("body div.img[trackerId="+contents.trackerId+"]").width()/2 }, function() {
                                $(this).fadeOut('fast').remove();
                            });
    
                            // grab input information and start download
                            contents.meta.bitrate = $.isNumeric($("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container select#bitrate").val()) ? $("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container select#bitrate").val() : 128;
                            filename = $("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container input#filename").val();
                            if(filename) {
                                filename = filename.replace(/[/\\:\*\?"<>\|]/g, '');
                                if(filename.length > 0) {
                                    i = 0;
                                    while(fs.existsSync(path.resolve(path.join(contents.path.download.folder, filename+".mp3")))) {
                                        filename = filename + " ("+i+")";
                                    }
                                    delete i;
                                    contents.path.download.file = filename;
                                    }
                            }
                            delete filename;
    
                            genres = { "00": "Blues", "01": "Classic rock", "02": "Country", "03": "Dance", "04": "Disco", "05": "Funk", "06": "Grunge", "07": "Hip-Hop", "08": "Jazz", "09": "Metal", "10": "New Age", "11": "Oldies", "12": "Other", "13": "Pop", "14": "Rhythm and Blues", "15": "Rap", "16": "Reggae", "17": "Rock", "18": "Techno", "19": "Industrial", "20": "Alternative", "21": "Ska", "22": "Death metal", "23": "Pranks", "24": "Soundtrack", "26": "Ambient", "27": "Trip-Hop", "28": "Vocal", "29": "Jazz & Funk", "30": "Fusion", "31": "Trance", "32": "Classical", "33": "Instrumental", "34": "Acid", "35": "House", "36": "Game", "37": "Sound clip", "38": "Gospel", "39": "Noise", "40": "Alternative Rock", "41": "Bass", "42": "Soul", "43": "Punk", "44": "Space", "45": "Meditative", "47": "Instrumental Rock", "48": "Ethnic", "49": "Gothic", "50": "Darkwave", "51": "Techno-Industrial", "52": "Electronic", "53": "Pop-Folk", "54": "Eurodance", "55": "Dream", "56": "Southern Rock", "57": "Comedy", "58": "Cult", "59": "Gangsta", "60": "Top 40", "61": "Christian Rap", "62": "Pop/Funk", "63": "Jungle", "64": "Native US", "65": "Cabaret", "66": "New Wave", "67": "Psychedelic", "68": "Rave", "69": "Show tunes", "70": "Trailer", "71": "Lo-Fi", "72": "Tribal", "73": "Acid Punk", "74": "Acid Jazz", "75": "Polka", "76": "Retro", "77": "Musical", "78": "Rock ’n’ Roll", "79": "Hard Rock" };
                            contents.meta.titles.title = $("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container input#title").val().replace(/[/\\:\*\?"<>\|]/g, '') ? $("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container input#title").val().replace(/[/\\:\*\?"<>\|]/g, '') : contents.meta.titles.title;
                            contents.meta.artist = $("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container input#artist").val().replace(/[/\\:\*\?"<>\|]/g, '') ? $("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container input#artist").val().replace(/[/\\:\*\?"<>\|]/g, '') : contents.meta.artist;
                            contents.meta.album.name = $("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container input#album").val().replace(/[/\\:\*\?"<>\|]/g, '') ? $("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container input#album").val().replace(/[/\\:\*\?"<>\|]/g, '') : contents.meta.album.name;
                            contents.meta.year = $.isNumeric($("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container input#year").val()) ? $("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container input#year").val() : contents.meta.year;
                            if(genres[$("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container select#genre").val()]) contents.meta.genres.push(genres[$("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container select#genre").val()]);
                            contents.meta.lyrics = $("section.modal[trackerId="+contents.trackerId+"] div.contents div.right div.container textarea#lyrics").val() || contents.meta.lyrics;
                            delete genres;
    
                            contents.path.temp.full_path = path.resolve(path.join(contents.path.temp.folder, contents.path.temp.file + ".mp3"));
                            contents.path.download.full_path = path.resolve(path.join(contents.path.download.folder, contents.path.download.file + ".mp3"));
    
    
                            $("section.modal[trackerId="+contents.trackerId+"] div.contents").slideUp('fast').fadeOut('slow', function() {
                                $("section.modal[trackerId="+contents.trackerId+"]").fadeOut('fast', function() {
                                    $(this).remove();
    
                                    musicEngine.datab64encode(contents.meta.album.cover.url, function(b64) {
                                        var img = b64.split(',', 2)[1];
                                        if(contents.meta.album.cover.buffer == null) {
                                            contents.meta.album.cover.buffer = new Buffer.from(img, 'base64');
                                        }
                                        
                                        if(!$('i#download div.downloads').length > 0) $('i#download').append('<div class="downloads"></div>');
                                        $('i#download').append('<span trackerId="'+contents.trackerId+'"></span>');
                                        $('i#download div.downloads').append('<div class="item" trackerId="'+contents.trackerId+'"><div class="img" style="background-image: url('+(contents.meta.album.cover.url || "")+');" ><i class="fas fa-pause"></i></div><p class="title">'+contents.meta.titles.title+'</p><div class="progressbar"><div class="progress"></div></div></div>');
                                        
                                        contents.element.span = $("i#download span[trackerId="+contents.trackerId+"]").get(0);
                                        contents.element.downloadItem = $("i#download div.downloads div.item[trackerId="+contents.trackerId+"]").get(0);
                                            
                                        if(queue.length >= 2) {
                                            queue.push({
                                                contents: contents,
                                                downloading: false,
                                                startDownload: function() {
                                                    for(i = 0; i < queue.length; i++) {
                                                        if(queue[0].trackerId == contents.trackerId) {
                                                            queue[0].downloading = true;
                                                            window.download.song(contents, options);
                                                            break;
                                                        }
                                                    }
                                                },
                                                trackerId: contents.trackerId
                                            });
                                        } else {
                                            window.download.song(contents, options);
                                        }
                                    });
                                });
                            });
                        });
                    }
                });
            });
        });
    },
    play: function(id, options) {
        play.id(id);
    },
    datab64encode: function(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            var reader = new FileReader();
            reader.onloadend = function() {
                callback(reader.result);
            }
            reader.readAsDataURL(xhr.response);
        };
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.send();
    }, 
    search: function(query, callbacks) {
        if(typeof callbacks.success != "function" && typeof callbacks.success != "undefined") throw "Callback success needs to be a function";
        if(typeof callbacks.error != "function" && typeof callbacks.error != "undefined") throw "Callback error needs to be a function";
        if(typeof callbacks.always != "function" && typeof callbacks.always != "undefined") throw "Callback always needs to be a function";
        if(typeof callbacks.progress != "function" && typeof callbacks.progress != "undefined") throw "Callback progress needs to be a function";

        $.ajax("https://api.musicengine.co/search", {
            method: "GET",
            dataType: "json",
            data: {
                q: query
            },
            headers: {
                Authorization: window.generateRandomId(32)
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

var play = {
    id: function(id) {
        if(queue.play.next.length > 0) {
            queue.play.next.push({
                id: id
            });
            
            if(queue.play.next.length > 0) $("body footer div.player div.controls svg[action=skip]").attr("clickable", "true");
            else $("body footer div.player div.controls svg[action=skip]").attr("clickable", "false");
    
            if(queue.play.previous.length > 0) $("body footer div.player div.controls svg[action=prev]").attr("clickable", "true");
            else $("body footer div.player div.controls svg[action=prev]").attr("clickable", "false");
        } else {
            if(audio.currentTime == audio.duration || audio.src == "") {
                // nothing playing
                queue.play.current = { id: id };
        
                if(queue.play.next.length > 0) $("body footer div.player div.controls svg[action=skip]").attr("clickable", "true");
                else $("body footer div.player div.controls svg[action=skip]").attr("clickable", "false");
        
                if(queue.play.previous.length > 0) $("body footer div.player div.controls svg[action=prev]").attr("clickable", "true");
                else $("body footer div.player div.controls svg[action=prev]").attr("clickable", "false");

                ytdl.getInfo("https://www.youtube.com/watch?v="+queue.play.current.id, { quality: "highestaudio", filter: 'audioonly' }, function(err, res) {
                    if(err) {
                        //Error: This video is not available.
                        play.next();
                    } else {
                        for(i = 0; i < res['formats'].length; i++) {
                            if(!!res['formats'][i]['type'].match(/(audio\/mp4|audio\/webm)/)) {
                                $("body footer div.player div.controls svg[action=play]").hide();
                                $("body footer div.player div.controls svg[action=pause]").show();
                                $("body footer div.player div.controls svg[action=play]").attr("clickable", "true");

                                audio.src = res['formats'][i]['url'];
                                audio.play();
                                break;
                            }
                        }
                    };
                });
            } else {
                // song playing, append to queue
                queue.play.next.push({
                    id: id
                });

                if(queue.play.next.length > 0) $("body footer div.player div.controls svg[action=skip]").attr("clickable", "true");
                else $("body footer div.player div.controls svg[action=skip]").attr("clickable", "false");
        
                if(queue.play.previous.length > 0) $("body footer div.player div.controls svg[action=prev]").attr("clickable", "true");
                else $("body footer div.player div.controls svg[action=prev]").attr("clickable", "false");
            }
        }
    },
    next: function() {
        if(queue.play.next.length > 0) {
            if(!audio.paused) audio.pause();

            if(queue.play.current.id != null) queue.play.previous.push(queue.play.current);
            queue.play.current = queue.play.next[0];
            queue.play.next.shift();
    
            if(queue.play.next.length > 0) $("body footer div.player div.controls svg[action=skip]").attr("clickable", "true");
            else $("body footer div.player div.controls svg[action=skip]").attr("clickable", "false");
    
            if(queue.play.previous.length > 0) $("body footer div.player div.controls svg[action=prev]").attr("clickable", "true");
            else $("body footer div.player div.controls svg[action=prev]").attr("clickable", "false");
    
            ytdl.getInfo("https://www.youtube.com/watch?v="+queue.play.current.id, { quality: "highestaudio", filter: 'audioonly' }, function(err, res) {
                if(err) {
                    //Error: This video is not available.
                    play.next();
                } else {
                    for(i = 0; i < res['formats'].length; i++) {
                        if(!!res['formats'][i]['type'].match(/(audio\/mp4|audio\/webm)/)) {
                            $("body footer div.player div.controls svg[action=play]").hide();
                            $("body footer div.player div.controls svg[action=pause]").show();
                            $("body footer div.player div.controls svg[action=play]").attr("clickable", "true");
    
                            audio.src = res['formats'][i]['url'];
                            audio.play();
                            break;
                        }
                    }
                };
            });
        } else {
            if($("body footer div.player div.controls svg[action=next]").attr("clickable") != "false") {
                $("body footer div.player div.controls svg[action=next]").attr("clickable", false);
            }
        }
    },
    previous: function() {
        if(queue.play.previous.length > 0) {
            if(!audio.paused) audio.pause();

            if(queue.play.current.id != null) queue.play.next = [queue.play.current, ...queue.play.next];
            queue.play.current = queue.play.previous[queue.play.previous.length - 1];
            queue.play.previous.slice(queue.play.previous.length - 1);
    
            if(queue.play.next.length > 0) $("body footer div.player div.controls svg[action=skip]").attr("clickable", "true");
            else $("body footer div.player div.controls svg[action=skip]").attr("clickable", "false");
    
            if(queue.play.previous.length > 0) $("body footer div.player div.controls svg[action=prev]").attr("clickable", "true");
            else $("body footer div.player div.controls svg[action=prev]").attr("clickable", "false");
    
            ytdl.getInfo("https://www.youtube.com/watch?v="+queue.play.current.id, { quality: "highestaudio", filter: 'audioonly' }, function(err, res) {
                if(err) {
                    //Error: This video is not available.
                    play.next();
                } else {
                    for(i = 0; i < res['formats'].length; i++) {
                        if(!!res['formats'][i]['type'].match(/(audio\/mp4|audio\/webm)/)) {
                            $("body footer div.player div.controls svg[action=play]").hide();
                            $("body footer div.player div.controls svg[action=pause]").show();
                            $("body footer div.player div.controls svg[action=play]").attr("clickable", "true");
    
                            audio.src = res['formats'][i]['url'];
                            audio.play();
                            break;
                        }
                    }
                };
            });
        } else {
            if($("body footer div.player div.controls svg[action=prev]").attr("clickable") != "false") {
                $("body footer div.player div.controls svg[action=prev]").attr("clickable", false);
            }
        }
    }
};

// [32, 33, 34, 35, 36, 37, 38, 39, 40]

$(document).ready(function() {
    $(window).click(function(e) {
        if($('section.modal').length > 0) {
            for(var i = 0; i < $('section.modal').length; i++) {
                if(e.target == $('section.modal').get(i)) {
                    if($(e.target).attr("closeable") != "false") $(e.target).remove();
                    break;
                }
            }
        }
    });
});


ipc.on('action', (event, action) => {
    if(action == "play/pause") {
        if(audio.paused) audio.play();
        else audio.pause();
    } else if(action == "previous") {
        play.previous();
    } else if(action == "next") {
        play.next();
    } else if(action == "stop") {
        //play.stop();
    }
})