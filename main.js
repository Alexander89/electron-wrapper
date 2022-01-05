const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const fs = require('fs/promises')
const { O_RDWR, O_CREAT, O_EXCL } = require('fs').constants

const { Menu } = require('electron')
const { clear } = require('console')

const settingsfile = 'settings.json'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 1024,
    title: "harvest app",
    resizable: true,
    transparent: false,
    frame: true,
    // titleBarStyle: 'hiddenInset',
    icon: path.join(__dirname, 'icons.icns')
  })

  let getUrlItem = () => mainWindow
    .webContents
    .executeJavaScript('localStorage.getItem("url");', true)

  let clearUrlItem = () => mainWindow
    .webContents
    .executeJavaScript('localStorage.setItem("url", null);', true)

  let last_stored_url = undefined

  const saveUrl = async (url) =>
    fs.open(settingsfile, O_RDWR | O_CREAT)
      .then(f => f.readFile().then(buffer => {
        f.close()
        return buffer
      }))
      .then(buffer => {
        let contentStr = buffer.toString('utf8')
        let content = {}

        try { content = JSON.parse(contentStr) }
        catch (_) { }

        content.url = url

        return JSON.stringify(content, undefined, 2)
      }).then(buffer => {
        fs.writeFile(settingsfile, buffer)
      })

  const readUrl = async () =>
    fs.open(settingsfile, O_RDWR | O_CREAT)
      .then(f => f.readFile().then(buffer => {
        f.close()
        return buffer
      }))
      .then(buffer => {
        let contentStr = buffer.toString('utf8')
        let content = { url: "" }
        try { content = JSON.parse(contentStr) }
        catch (_) { }
        return content.url
      })

  const openUrl = (url) => {
    if (last_stored_url === url) {
      return
    }
    last_stored_url = url
    console.log("page", last_stored_url, url)

    if (typeof url !== "string" || !url.startsWith('https://')) {
      console.log("index.html")
      mainWindow.loadFile("index.html")
    } else {
      console.log("clear()")
      saveUrl(url)
      cancel()
      clearUrlItem()
      mainWindow.loadURL(url)
    }
  }

  const urlSelect = () => {
    mainWindow.loadFile("index.html")
    let interval = setInterval(
      () => getUrlItem("url").then(openUrl),
      250
    )
    return () => clearInterval(interval)
  }
  let cancel = urlSelect()

  readUrl().then(openUrl)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  var template = [
    {
      label: "Application",
      submenu: [
        { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
        { type: "separator" },
        {
          label: "change URL", click: () => {
            console.log("clear()")
            mainWindow.loadFile("index.html");
            cancel = urlSelect()
          }
        },
        { type: "separator" },
        { label: "Hide", accelerator: "Command+H", click: () => app.hide() },
        { type: "separator" },
        { label: "Quit", accelerator: "Command+Q", click: () => app.quit() },
        { type: "separator" }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
