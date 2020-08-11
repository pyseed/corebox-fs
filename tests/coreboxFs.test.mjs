import chai from 'chai'
import sinon from 'sinon'
import fs from 'fs'
import { load, save, initFile, mkdir, getPathBase, ls, Event } from '../src/coreboxFs.mjs'

const assert = chai.assert
const expect = chai.expect

suite('corebox-fs', () => {
  teardown(() => {
    sinon.restore()
  })

  test('load', () => {
    const expected = ['expected']
    const fake = sinon.fake.returns(expected)
    sinon.replace(fs, 'readFileSync', fake)

    const filePath = '/tmp/fake.txt'

    const res = load(filePath)
    sinon.assert.calledWithExactly(fs.readFileSync, filePath, { encoding: 'utf-8' })
    assert.strictEqual(res, expected)

    const res2 = load(filePath, 'encoding')
    sinon.assert.calledWithExactly(fs.readFileSync, filePath, { encoding: 'encoding' })
    assert.strictEqual(res2, expected)
  })

  test('save', () => {
    const fake = sinon.fake.returns(true)
    sinon.replace(fs, 'writeFileSync', fake)

    const filePath = '/tmp/fake.txt'

    const content = 'fake file content'
    save(filePath, content)
    sinon.assert.calledWithExactly(fs.writeFileSync, filePath, content, { encoding: 'utf-8', mode: 0o755 })

    save(filePath, content, 'encoding')
    sinon.assert.calledWithExactly(fs.writeFileSync, filePath, content, { encoding: 'encoding', mode: 0o755 })

    save(filePath, content, 'encoding', 0o750)
    sinon.assert.calledWithExactly(fs.writeFileSync, filePath, content, { encoding: 'encoding', mode: 0o750 })
  })

  suite('initFile', () => {
    test('file does not exists', () => {
      const fakeExistsSync = sinon.fake.returns(false) // file does not exists
      sinon.replace(fs, 'existsSync', fakeExistsSync)
      const fakeWriteFileSync = sinon.fake.returns(true)
      sinon.replace(fs, 'writeFileSync', fakeWriteFileSync)

      const filePath = '/tmp/fake.txt'
      const content = 'fake file content'
      const res = initFile(filePath, () => content)

      sinon.assert.calledWithExactly(fs.existsSync, filePath)
      sinon.assert.calledWithExactly(fs.writeFileSync, filePath, content, { encoding: 'utf-8', mode: 0o755 })
      assert.strictEqual(res, true, 'has been initialised')
    })

    test('file does exists', () => {
      const fakeExistsSync = sinon.fake.returns(true) // file exists
      sinon.replace(fs, 'existsSync', fakeExistsSync)
      const fakeWriteFileSync = sinon.fake.returns(true)
      sinon.replace(fs, 'writeFileSync', fakeWriteFileSync)

      const filePath = '/tmp/fake.txt'
      const content = 'fake file content'
      const res = initFile(filePath, () => content)

      sinon.assert.calledWithExactly(fs.existsSync, filePath)
      sinon.assert.notCalled(fs.writeFileSync) // file exists so should not be replaced !
      assert.strictEqual(res, false, 'has not been initialised (already exists)')
    })
  })

  test('mkdir', () => {
    const fake = sinon.fake.returns(true)
    sinon.replace(fs, 'mkdirSync', fake)

    const dirPath = '/tmp/tmp1'

    mkdir(dirPath)
    sinon.assert.calledWithExactly(fs.mkdirSync, dirPath, { mode: 0o755, recursive: true })

    // mkdir(dirPath, { custom: true })
    // sinon.assert.calledWithExactly(fs.mkdirSync.sync, dirPath, { custom: true, recursive: true })
  })

  test('getPathBase', () => {
    assert.deepEqual(getPathBase('/dir1/dir2/file.ext'), 'file')
    assert.deepEqual(getPathBase('/dir1/dir2/file.ext', true), 'file.ext')
    assert.deepEqual(getPathBase('/dir1/dir2'), 'dir2')
  })

  suite('ls', () => {
    test('onlyDir and onlyFile are exclusive', () => {
      const basePath = '/tmp/tmp1'

      const fakeReaddirSync = sinon.fake.returns(['file'])
      sinon.replace(fs, 'readdirSync', fakeReaddirSync)
      const fakeStats = sinon.fake.returns(true)
      const fakeStatSync = sinon.fake.returns({ isDirectory: fakeStats })
      sinon.replace(fs, 'statSync', fakeStatSync)

      expect(() => {
        ls(basePath, { onlyDir: true, onlyFile: true })
      }).to.throw('onlyDir and onlyFile options can not be set together')
    })

    test('only directory, file is a directory', () => {
      const basePath = '/tmp/tmp1'
      const file = 'file'
      const filePath = '/tmp/tmp1/file'
      const isDirectory = true // file assumed to be a directory

      const fakeReaddirSync = sinon.fake.returns([file])
      sinon.replace(fs, 'readdirSync', fakeReaddirSync)
      const fakeStats = sinon.fake.returns(isDirectory)
      const fakeStatSync = sinon.fake.returns({ isDirectory: fakeStats })
      sinon.replace(fs, 'statSync', fakeStatSync)

      const res = ls(basePath, { onlyDir: true })
      sinon.assert.calledWithExactly(fs.readdirSync, basePath)
      sinon.assert.calledWithExactly(fs.statSync, filePath)
      assert.deepEqual(res, [filePath])
    })

    test('only directory, file is not a directory', () => {
      const basePath = '/tmp/tmp1'
      const file = 'file'
      const filePath = '/tmp/tmp1/file'
      const isDirectory = false // file assumed to not be a directory

      const fakeReaddirSync = sinon.fake.returns([file])
      sinon.replace(fs, 'readdirSync', fakeReaddirSync)
      const fakeStats = sinon.fake.returns(isDirectory)
      const fakeStatSync = sinon.fake.returns({ isDirectory: fakeStats })
      sinon.replace(fs, 'statSync', fakeStatSync)

      const res = ls(basePath, { onlyDir: true })
      sinon.assert.calledWithExactly(fs.readdirSync, basePath)
      sinon.assert.calledWithExactly(fs.statSync, filePath)
      assert.deepEqual(res, [])
    })

    test('only file, file is a file', () => {
      const basePath = '/tmp/tmp1'
      const file = 'file'
      const filePath = '/tmp/tmp1/file'
      const isDirectory = false // file assumed to be a file

      const fakeReaddirSync = sinon.fake.returns([file])
      sinon.replace(fs, 'readdirSync', fakeReaddirSync)
      const fakeStats = sinon.fake.returns(isDirectory)
      const fakeStatSync = sinon.fake.returns({ isDirectory: fakeStats })
      sinon.replace(fs, 'statSync', fakeStatSync)

      const res = ls(basePath, { onlyFile: true })
      sinon.assert.calledWithExactly(fs.readdirSync, basePath)
      sinon.assert.calledWithExactly(fs.statSync, filePath)
      assert.deepEqual(res, [filePath])
    })

    test('only file, file is not a file', () => {
      const basePath = '/tmp/tmp1'
      const file = 'file'
      const filePath = '/tmp/tmp1/file'
      const isDirectory = true // file assumed to not be a file

      const fakeReaddirSync = sinon.fake.returns([file])
      sinon.replace(fs, 'readdirSync', fakeReaddirSync)
      const fakeStats = sinon.fake.returns(isDirectory)
      const fakeStatSync = sinon.fake.returns({ isDirectory: fakeStats })
      sinon.replace(fs, 'statSync', fakeStatSync)

      const res = ls(basePath, { onlyFile: true })
      sinon.assert.calledWithExactly(fs.readdirSync, basePath)
      sinon.assert.calledWithExactly(fs.statSync, filePath)
      assert.deepEqual(res, [])
    })
  })

  suite('Event', () => {
    test('init default', async () => {
      const o = new Event()

      assert.isFunction(o.emit)
      assert.isFunction(o.on)
      assert.isFunction(o.off)
      assert.isFunction(o.once)
      assert.isFunction(o.listeners)
    })

    test('on / emit', async () => {
      let message = ''

      const o = new Event()
      o.on('message', msg => { message = msg })

      await o.emit('message', 'foobar')
      assert.strictEqual(message, 'foobar')
    })
  })
})
