var keybinds = {
    add: function(keys, callback) {
        if(typeof callback != "function") throw "Callback must be a function.";
        if(typeof keys != "object") throw "Keys value must be an object.";

        var id = window.generateRandomId(),
            key = [];
        if(keys.hasOwnProperty('length')) {
            for(var i = 0; i < keys.length; i++) {
                if(typeof keys[i] != "object") throw "Keys[] value must be an object.";
                if(typeof keys[i].keyCode != "number") throw "Invalid keyCode value provided, keyCode must be numeric.";
                if(typeof keys[i].ctrl != "undefined" && typeof keys[i].ctrl != "boolean") throw "Invalid ctrl value provided at keys["+i+"], value must be undefined or boolean.\n("+keys[i].ctrl+" : "+typeof keys[i].ctrl+")";
                if(typeof keys[i].shift != "undefined" && typeof keys[i].shift != "boolean") throw "Invalid shift value provided at keys["+i+"], value must be undefined or boolean.\n("+keys[i].shift+" : "+typeof keys[i].shift+")";
                key.push({ "keyCode": keys[i].keyCode, "ctrl": keys[i].ctrl ? true : false, "shift": keys[i].shift ? true : false });
            }
        } else {
            throw "Keys must be an array object.";
        }
        if(key.length < 1) throw "Key list is empty";
        this.list.push({ "id": id, "key": key, "callback": callback });
        return id;
    },
    remove: function(id) {
        if(this.list.length > 0) {
            for(var i = 0; i < this.list.length; i++) {
                if(this.list[i].id == id) {
                    this.list.splice(i, 1);
                    return true;
                }
            }
        }
        return false;
    },
    get: function(id = null) {
        if(typeof id == "string") {
            if(this.list.length > 0) {
                for(var i = 0; i < this.list.length; i++) {
                    if(this.list[i].id == id) {
                        return this.list[i];
                    }
                }
            }
            return [];
        } else if (id == null) {
            if(this.list.length > 0) return this.list;
            return [];
        } else {
            throw "Can't get key with id["+id+"]";
        }
    },
    list: []
}

/**
 * Register default keybinds
 */

// inspect element
keybinds.add([{ "keyCode": 9, "ctrl": true, "shift": true }], function () { electron.ipcRenderer.send("toggle", "developerTools"); });
// quick search
keybinds.add([{ "keyCode": 5, "ctrl": true }], function () { $("input#search").focus(); $("input#search").select(); });
// reload
keybinds.add([{ "keyCode": 18, "ctrl": true }], function () { location.reload(); });

/**
 * Listen for keypress
 */
$(document).ready(function() {
    $(document).keypress(function(e) {
        for(var i = 0; i < keybinds.list.length; i++) {
            for(var x = 0; x < keybinds.list[i].key.length; x++) {
                if(e.keyCode !== keybinds.list[i].key[x].keyCode) continue;
                if(keybinds.list[i].key[x].shift !== e.shiftKey) continue;
                if(keybinds.list[i].key[x].ctrl !== e.ctrlKey) continue;
    
                e.preventDefault();
                keybinds.list[i].callback();
                break;
            }
        }
    });
});