var contextMenus = {
    add: function(element, callback) {
        if(typeof callback == "function") {
            // generates custom ID
            id = window.generateRandomId();
            // adds menu to array list
            this.list.push({ id: id, element: element, callback: callback });

            $(element).contextmenu(function(e) {
                e.preventDefault();
                callback(e);
            });

            return id;
        } else throw "Invalid callback, callback must be a function";
    },
    remove: function(id) {
        if(this.list.length > 0) {
            for(var i = 0; i < this.list.length; i++) {
                if(this.list[i].id == id) {
                    // removes event listener from element
                    $(element).off('contextmenu');

                    // removes menu from array list
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

$(document).ready(function() {
    // registering default context menus
    contextMenus.add("input#search", function(e) {
        const menu = new Menu();
        menu.append(new MenuItem({ label: 'Cut', accelerator: "CmdOrCtrl+X", role: "cut" }));
        menu.append(new MenuItem({ label: 'Copy', accelerator: "CmdOrCtrl+C", role: "copy" }));
        if(electron.clipboard.readText().length > 0) menu.append(new MenuItem({ label: 'Paste', accelerator: "CmdOrCtrl+V", role: "paste" }));
        else menu.append(new MenuItem({ label: 'Paste', accelerator: "CmdOrCtrl+V", role: "paste", enabled: false }));
        menu.append(new MenuItem({ type: 'separator' }));
        if($("input#search").val().length > 0) menu.append(new MenuItem({ label: 'Select All', accelerator: "CmdOrCtrl+A", role: "selectall" }));
        else menu.append(new MenuItem({ label: 'Select All', accelerator: "CmdOrCtrl+A", role: "selectall", enabled: false }));

        menu.popup({ window : remote.getCurrentWindow() });
    });

    // listening for right click event
    $(window).contextmenu(function(e){
        if($(e.target).closest('.video').length > 0) {
            id = $(e.target).closest('.video').attr("videoId");
            menu = new Menu();

            playlists = new Menu();
            playlists.append(new MenuItem({ label: 'Create new Playlist' }));

            menu.append(new MenuItem({ label: 'Play Next', click() {
                musicEngine.play(id);
            } }));
            menu.append(new MenuItem({ label: 'Download', click() {
                musicEngine.download(id, {
                    success: function(contents) {
                        console.log("Download complete, file saved at "+contents.path.download.full_path);
                        // console.log(e);
                    },
                    error: function(data) {
                        console.log("There was an error downloading music.");
                        // console.error(e);
                    }
                });
            } }));
            menu.append(new MenuItem({ label: 'Add to Playlist', submenu: playlists }));
            menu.append(new MenuItem({ type: 'separator' }));
            menu.append(new MenuItem({ label: 'Play on YouTube', click() {
                electron.shell.openExternal("https://www.youtube.com/watch?v="+id);
            } }));
            menu.append(new MenuItem({ type: 'separator' }));
            menu.append(new MenuItem({ label: 'Learn More' }));

            menu.popup({ window : remote.getCurrentWindow() });
        }
    });
});