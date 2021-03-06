import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events'

/**
 * load text file
 * @param {String}  filePath  path file
 * @param {String}  encoding  encoding (default is utf-8)
 * @return {String} loaded content
 */
const load = (filePath, encoding) => fs.readFileSync(filePath, { encoding: encoding || 'utf-8' })

/**
 * save text file
 * @param {String}  filePath  path file
 * @param {String}  content   file content
 * @param {String}  encoding  encoding (default is utf-8)
 * @param {String}  mode      write mode (default is 0o755)
 */
const save = (filePath, content, encoding, mode) => fs.writeFileSync(filePath, content, { encoding: encoding || 'utf-8', mode: mode || 0o755 })

/**
 * init text file
 * if file does not exists, apply contentFx function to create file
 * @param {String}  filePath    path file
 * @param {String}  contentFx   function () => { return 'content' }
 * @return {String/bool} created content of false if file already exists
 */
const initFile = (filePath, contentFx) => {
  if (!fs.existsSync(filePath)) {
    save(filePath, contentFx())
    return true
  }

  return false
}

/**
 * mkdir recursive
 * @param {String}  dirPath  path to create
 * @param {Object}  options  default { mode: 0o755 }
 */
const mkdir = (dirPath, options = { mode: 0o755 }) => {
  fs.mkdirSync(dirPath, { ...options, recursive: true })
}

/**
 * get file name from path
 * @param {String}  fullPath        file path
 * @param {bool}    withExtention   get extension
 * @return {String} file name
 */
const getPathBase = (fullPath, withExtention) => {
  const extension = withExtention ? undefined : path.extname(fullPath)
  return path.basename(fullPath, extension)
}

/**
 * list dir
 * @param {String}  dirPath  path to list
 * @param {Object}  options  { onlyDir: true/false, onlyFile: true/false }
 * @return {Array} array of full path
 */
const ls = (dirPath, options) => {
  if (options.onlyDir && options.onlyFile) {
    throw new Error('onlyDir and onlyFile options can not be set together')
  }

  const res = []

  const files = fs.readdirSync(dirPath)
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stats = fs.statSync(filePath)

    let select = false
    const isDir = stats.isDirectory()
    if (options) {
      if (options.onlyDir) {
        select = isDir
      } else if (options.onlyFile) {
        select = !isDir
      }
    } else {
      select = true
    }

    if (select) {
      res.push(filePath)
    }
  }

  return res
}

class Event { // EventEmitter composition
  constructor (props = {}) {
    this.maxListeners = props.maxListeners || 0
    this.emitter = new EventEmitter()

    if (this.maxListeners > 0) {
      this.emitter.setMaxListeners(this.maxListeners)
    } // default is 10 if not set
  }

  emit (eventName, ...args) {
    this.emitter.emit(eventName, ...args)
    return this
  }

  on (eventName, fx) {
    this.emitter.on(eventName, fx)
    return this
  }

  off (eventName, fx) {
    this.emitter.on(eventName, fx)
    return this
  }

  once (eventName, fx) {
    this.emitter.once(eventName, fx)
    return this
  }

  listeners (eventName) {
    return this.emitter.listeners(eventName)
  }
}

export { load, save, initFile, mkdir, getPathBase, ls, Event }
