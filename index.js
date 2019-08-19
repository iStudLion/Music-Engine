const {app, ipcMain, BrowserWindow, globalShortcut } = require('electron');
const nativeImage = require('electron').nativeImage;
const protocol = require('electron').protocol;
let shell = require('electron').shell;

const path = require('path');


let icon =  nativeImage.createFromPath(path.join(__dirname, 'assets/img/favicon.ico'));
let win, loader;


/**
 * App events comes here
 */
app.on('ready', () => {
	app.setName("Music Engine");

	win = new BrowserWindow({
		title: 'Music Engine',
		backgroundColor: '#ECEBF3',
		width: 1280,
		height: 720,
		icon: icon,
		minWidth: 640,
		minHeight: 360,
		center: true,
		show: false,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true
        }
	});
	win.removeMenu();
	win.loadURL(`file://${__dirname}/assets/pages/dashboard.html`);

	loader = new BrowserWindow({
		title: 'Music Engine',
		backgroundColor: '#3A506B',
		width: 275,
		height: 375,
		icon: icon,
		frame: false,
		minWidth: 275,
		minHeight: 375,
		maxWidth: 275,
		maxHeight: 375,
		center: true,
		resizable: false,
		movable: false,
        closable: false,
		show: false,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true
        }
	});
	loader.loadURL(`file://${__dirname}/assets/pages/loader.html`);

	
	win.on('close', () => { app.quit() });
	win.on('focus', () => { win.flashFrame(false) });

	win.ready = false;
	win.on('ready-to-show', () => {
		win.ready = true;
	});

	loader.on('ready-to-show', () => { 
		loader.show();
		loader.webContents.send('command', {
			recipient: "loader",
			command: "start"
		});

		ipcMain.on('load-complete', () => {
			if(win.ready) {
				loader.hide();
				win.show();
				win.focus();
			} else {
				win.on('ready-to-show', () => {
					loader.hide();
					win.show();
					win.focus();
				});
			}
		});
	});
	loader.on('close', () => { app.quit() });

	globalShortcut.register('MediaPlayPause', () => {
		win.webContents.send('action', 'play/pause');
	});

	globalShortcut.register('MediaNextTrack', () => {
		win.webContents.send('action', 'next');
	});

	globalShortcut.register('MediaPreviousTrack', () => {
		win.webContents.send('action', 'previous');
	});

	globalShortcut.register('MediaStop', () => {
		win.webContents.send('action', 'stop');
	});

	protocol.registerHttpProtocol("musicengine", (req, cb) => {
		console.log("protocol called: "+JSON.stringify(req));
	});

	win.webContents.toggleDevTools();

	app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('will-quit', () => {
	globalShortcut.unregisterAll()
});

/**
 * ipcMain events comes here
 */

var ready = false;
ipcMain.on('ready', (event, args) => {
	if(ready != true) {
		if(args == true) {
			if(loader.isVisible()) loader.destroy();
			if(!win.isVisible()) {
				win.show();
				win.focus();
			}
		}
	}
});

ipcMain.on('toggle', (event, args) => {
    if(args == "developerTools") {
		if(!app.isPackaged || true) win.webContents.toggleDevTools()
    }
});

ipcMain.on('online-status-change', (event, args) => {
	if(args.status == "online") {
		if(!win.isVisible()) win.show();
		if(loader.isVisible()) loader.hide();
	} else if(args.status == "offline") {
		if(!loader.isVisible()) loader.show();
		if(win.isVisible()) win.hide();
	} else {
		console.warn("[WARNING] Invalid 'online-status-change' argument.");
	}
});

ipcMain.on('flash', (event, args) => {
	if(args == true) {
		if(!win.isFocused()) win.flashFrame(true);
	} else {
		win.flashFrame(false);
	}
});

const folders = ["home", "appData", "userData", "temp", "exe", "module", "desktop", "documents", "downloads", "music", "pictures", "videos", "logs", "pepperFlashSystemPlugin"];
ipcMain.on('getFolder', (event, args) => {
	if(folders.includes(args)) {
		event.returnValue = app.getPath(args);
	}
});

ipcMain.on('setProgress', (event, args) => {
	if(!isNaN(args)) {
		win.setProgressBar((args/100));
	} else {
		win.setProgressBar(-1);
	}
});

ipcMain.on('getCountryCode', (event, args) => {
	event.returnValue = app.getLocaleCountryCode();
});