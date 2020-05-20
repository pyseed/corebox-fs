import path from 'path'
import Mocha from './node_modules/mocha/index.js'

/*
mocha loader
  - experimental modules *.mjs compatible
  - you must freeze to mocha 5.2.0 (>= 6.0.0 needs a reporter)
*/

Mocha.prototype.loadFiles = async function (fn) {
  const self = this
  const suite = this.suite

  for await (let file of this.files) {
    file = path.resolve(file)
    console.info('loading...', file)
    suite.emit('pre-require', global, file, self)
    suite.emit('require', await import(file), file, self)
    suite.emit('post-require', global, file, self)
  }

  fn && fn()
}

Mocha.prototype.run = async function (fn) {
  console.info('running tests suites...')
  if (this.files.length) await this.loadFiles()

  const suite = this.suite
  const options = this.options
  options.files = this.files

  const runner = new Mocha.Runner(suite, options.delay)
  const reporter = new this._reporter(runner, options)

  function done (failures) {
    if (reporter.done) {
      reporter.done(failures, fn)
    } else {
      fn && fn(failures)
    }
  }

  runner.run(done)
}

const mocha = new Mocha({ ui: 'tdd', reporter: 'list' })
process.argv.slice(2).forEach(mocha.addFile.bind(mocha))
mocha.run(failures => { process.exitCode = failures > 0 ? -1 : 0 })
