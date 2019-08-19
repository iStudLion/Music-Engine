var download = {
    song: function(contents, options, dlatt = 0) {
        if(dlatt > 3) {
            console.error("There was an error downloading song");
            return;
        }

        contents.path.temp.file = generateRandomId(32);
        contents.path.temp.full_path = path.resolve(path.join(contents.path.temp.folder, contents.path.temp.file + ".mp3"));

        const file = ytdl('http://www.youtube.com/watch?v='+contents.videoId, {
            quality: "highestaudio",
            filter: 'audioonly'
        });

        contents.methods.stopDownload = function() { file.destroy(); }
        contents.methods.pauseDownload = function() { file.pause(); }
        contents.methods.resumeDownload = function() { file.resume(); }
        contents.methods.isDownloadPaused = function() { return file.isPaused(); }
        $(contents.element.downloadItem).children('div.img').children('i.fas.fa-pause').click(function() {
            file.pause();
            $(this).removeClass("fa-pause");
            $(this).addClass("fa-play");
        });

        $(contents.element.downloadItem).children('div.img').children('i.fas.fa-play').click(function() {
            file.resume();
            $(this).removeClass("fa-play");
            $(this).addClass("fa-pause");
        });

        $(contents.element.downloadItem).children('div.img').children('i.fas.fa-redo').click(function() {
            download.song(contents, options);
            $(this).removeClass("fa-redo");
            $(this).addClass("fa-pause");
            $(contents.element.downloadItem).children('div.progressbar').children('div.progress').css("background-color", "#33bb33");
        });

        file.once('response', () => {
            contents.progress.download.start = time();
            if(typeof options.start == "function") options.start(contents);
        });
        file.on('progress', (chunkLength, downloaded, total) => {
            contents.progress.download.size.downloaded = download;
            contents.progress.download.size.total = total;
                
            $(contents.element.downloadItem).children('div.progressbar').children('div.progress').css("width", Math.round(downloaded/total*100)+"%");
            ipcRenderer.send("setProgress", Math.round(downloaded/total*100));

            if(typeof options.progress == "function") options.progress(contents);
        });
        file.on('end', () => {
            contents.progress.download.finish = time();
            ipcRenderer.send("setProgress", -1);
        });
        file.on('error', (err) => {
            dlatt++

            file.destroy();
            ipcRenderer.send("setProgress", -1);
            
            if(err == "Error: This video is not available.") {
                $(contents.element.span).remove();
                $(contents.element.downloadItem).children('div.progressbar').children('div.progress').css("background-color", "red");
            } else if(err == "Error [ERR_STREAM_WRITE_AFTER_END]: write after end") {
                // automatically retry
                download.song(contents, options, dlatt);
            } else {
                $(contents.element.span).remove();
                $(contents.element.downloadItem).children('div.progressbar').children('div.progress').css("background-color", "red");
            }
            console.error(err);
        });
        file.on('finish', () => {
            function prepareFile(attempt = 0) {
                attempt++
                if(attempt > 10) return;
                fs.open(contents.path.temp.full_path, 'r+', function(err, fd){
                    if (err && err.code === 'EBUSY'){
                        // tries again in a few second
                        setTimeout(() => {
                            deleteFile(attempt);
                        }, 1500 * attempt);
                    } else if (err && err.code === 'ENOENT'){
                        // file doesn't exsit
                    } else {
                        // file has finished, ready to be opened.
                        fs.close(fd, function(){
                            const songBuffer = fs.readFileSync(contents.path.temp.full_path);

                            const writer = new ID3Writer(songBuffer);
                            writer.setFrame('TIT2', contents.meta.titles.title); // song name
                            writer.setFrame('TPE1', [contents.meta.artist]); // artists
                            if(contents.meta.album.name) writer.setFrame('TALB', contents.meta.album.name);
                            if(contents.meta.year)     writer.setFrame('TYER', contents.meta.year); // year
                            if(contents.meta.genres.length > 0) writer.setFrame('TCON', contents.meta.genres); // genres
                            if(contents.meta.lyrics)   writer.setFrame('USLT', {
                                                        description: 'Lyrics', // lyrics
                                                        lyrics: contents.meta.lyrics
                                                    });
                            writer.setFrame('APIC', {
                                type: 3,
                                data: contents.meta.album.cover.buffer,
                                description: 'Album Cover'
                            }); // album cover
                            writer.addTag();
                            
                            const taggedSongBuffer = Buffer.from(writer.arrayBuffer);
                            fs.writeFileSync(contents.path.download.full_path, taggedSongBuffer);
                            fs.unlinkSync(contents.path.temp.full_path);

                            //

                            ipcRenderer.send("setProgress", -1);
                            ipcRenderer.send("flash", true);
        
                            $(contents.element.span).remove();
                            $(contents.element.downloadItem).children('div.progressbar').children('div.progress').css("width", "100%");
                            $(contents.element.downloadItem).children('div.progressbar').children('div.progress').animate({backgroundColor: 'green'}, 'fast', function() {
                                $(this).animate({backgroundColor: '#33bb33'}, 'fast', function() {
                                    $(this).animate({backgroundColor: 'green'}, 'fast', function() {
                                        $(this).animate({backgroundColor: '#33bb33'}, 'fast', function() {
                                            $(this).animate({backgroundColor: 'green'}, 'fast', function() {
                                                $(this).animate({backgroundColor: '#33bb33'}, 'fast', function() {
                                                $(this).slideUp('fast').fadeOut('slow', function() {
                                                        $(contents.element.downloadItem).remove();
                                                    })
                                                });
                                            });
                                        });
                                    });
                                });
                            });

                            contents.progress.general.finish = time();

                            if(typeof options.success == "function") options.success(contents);
                            if(typeof options.finish == "function") options.finish(contents);
                            if(typeof options.always == "function") options.always();

                            // start next download from queue
                            if(queue.length > 0) {
                                for(i = 0; i < queue.length; i++) {
                                    if(queue[i].downloading == false) {
                                        queue[i].startDownload();
                                        break;
                                    }
                                }
                            }
                        });
                    }
                });
            }
            setTimeout(() => {
                prepareFile();
            }, 3000);
        });
            
        ffmpeg(file)
        .audioBitrate(contents.meta.bitrate || 128)
        .save(contents.path.temp.full_path);   
    }
};