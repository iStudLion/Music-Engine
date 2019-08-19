    const { remote, clipboard, ipcRenderer } = require('electron');
    const { Menu, MenuItem } = remote;
    const nativeImage = require('electron').nativeImage
    const fs = require("fs");
    const ytdl = require('ytdl-core');
    const path = require('path');
    const ffmpeg = require('fluent-ffmpeg');
    const ID3Writer = require('browser-id3-writer');
    const youtubeInfo = require('youtube-info');
    const https = require('https');

    // Reset progress
    ipcRenderer.send("setProgress", -1);

    /**
     * Register config and
     * check if download path is set and if download path exists.
     * else set the default path and create default folder if it doesn't exist.
     */
    var config = JSON.parse(fs.readFileSync('assets/configs/config.json'));
    if(typeof config.options.downloadPath == "undefined" || !fs.existsSync(config.options.downloadPath)) {
        let defaultDownloadFolder = path.resolve(path.join(ipcRenderer.sendSync("getFolder", "downloads"), "/Music Engine/"));
        if (!fs.existsSync(defaultDownloadFolder)) fs.mkdirSync(defaultDownloadFolder);
        config.options.downloadPath = defaultDownloadFolder;
        fs.writeFileSync('assets/configs/config.json', JSON.stringify(config, null, 2));
    }

    /**
     * Register other variables
     */
    const countryCode = ipcRenderer.sendSync("getCountryCode", null);
    const tempFolder = path.resolve(path.join(ipcRenderer.sendSync("getFolder", "temp"), "/musicengine/"));
    if(!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);
    var downloadFolder = config.options.downloadPath;

    /**
     * Generates random string
     */
    window.generateRandomId = function(len = 16) {
        var r='',c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        while(len != r.length) r += c.charAt(Math.floor(Math.random() * c.length));
        return r;
    }

    /**
     * Returns UNIX timestamp in seconds
     */
    window.time = function() {
        return Math.round(Date.now()/1000);
    }

    /**
     * Register all global functions
     */

    /**
     * Returns 'time ago' from date
     * @author Sam Clarke <sam@samclarke.com>
     * @source https://www.samclarke.com/javascript-convert-time-ago-future/
     */
    window.timeAgo = function(time) {
        lang = {
            postfixes: { '<': ' ago', '>': ' from now' },
            1000: { singular: 'a moment', plural: 'a moment' },
            60000: { singular: '1 minute', plural: '# minutes' },
            3600000: { singular: '1 hour', plural: '# hours' },
            86400000: { singular: '1 day', plural: '# days' },
            31540000000: { singular: '1 year', plural: '# years' }
        };

        var timespans = [1000, 60000, 3600000, 86400000, 31540000000];
        var parsedTime = Date.parse(time);
    
        if (parsedTime && Date.now) {
        var timeAgo = parsedTime - Date.now();
        var diff = Math.abs(timeAgo);
        var postfix = lang.postfixes[(timeAgo < 0) ? '<' : '>'];
        var timespan = timespans[0];
    
        for (var i = 1; i < timespans.length; i++) {
            if (diff > timespans[i])  timespan = timespans[i];
        }
    
        var n = Math.round(diff / timespan);
    
        return lang[timespan][n > 1 ? 'plural' : 'singular']
            .replace('#', n) + postfix;
        }
    }

    /**
     * Returns abbreviated number count
     * 1.7K, 2.4M, 4B etc
     */
    function abbreviateNumber(value) {
        let newValue = value;
        const suffixes = ["", "K", "M", "B","T"];
        let suffixNum = 0;
        while (newValue >= 1000) {
          newValue /= 1000;
          suffixNum++;
        }
      
        newValue = newValue.toPrecision(3);
      
        newValue += suffixes[suffixNum];
        return newValue;
      }

    /*
    * object.watch polyfill
    *
    * 2012-04-03
    *
    * By Eli Grey, http://eligrey.com
    * Public Domain.
    * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
    */
    if (!Object.prototype.watch) {
        Object.defineProperty(Object.prototype, "watch", {
            enumerable: false
            , configurable: true
            , writable: false
            , value: function (prop, handler) {
                var
                oldval = this[prop]
                , newval = oldval
                , getter = function () {
                    return newval;
                }
                , setter = function (val) {
                    oldval = newval;
                    return newval = handler.call(this, prop, oldval, val);
                }
                ;
                
                if (delete this[prop]) { // can't watch constants
                    Object.defineProperty(this, prop, {
                        get: getter
                        , set: setter
                        , enumerable: true
                        , configurable: true
                    });
                }
            }
        });
    }

    if (!Object.prototype.unwatch) {
        Object.defineProperty(Object.prototype, "unwatch", {
            enumerable: false
            , configurable: true
            , writable: false
            , value: function (prop) {
                var val = this[prop];
                delete this[prop]; // remove accessors
                this[prop] = val;
            }
        });
    }