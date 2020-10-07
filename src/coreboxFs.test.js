// import { jest } from '@jest/globals'
import fs from 'fs'
import mock from 'mock-fs'
import { load, save, initFile, mkdir, getPathBase, ls, Event } from './coreboxFs.mjs'

const checkFile = (filePath, expectedContent) => {
  const content = fs.readFileSync(filePath, { encoding: 'utf-8' })
  expect(content).toStrictEqual(expectedContent)
}

const testFile = (filePath, content) => fs.writeFileSync(filePath, content, { encoding: 'utf-8', mode: 0o755 })

mock({
  '/tmp/test.txt': 'test content',
  '/tmp/work_dir': {},
  '/tmp/dir': {
    sub_dir: {},
    'file1.txt': 'file1 content'
  },
  '/tmp/empty_dir': {}
})

afterAll(() => {
  mock.restore()
})

describe('corebox-fs', () => {
  test('load', () => {
    expect(load('/tmp/test.txt')).toStrictEqual('test content')
  })

  test('save', () => {
    const filePath = '/tmp/save.txt'
    const content = 'save content'
    save(filePath, content)
    checkFile(filePath, content)
  })

  describe('initFile', () => {
    test('file does not exists', () => {
      const filePath = '/tmp/init.txt'
      const content = 'init content'
      expect(initFile('/tmp/init.txt', () => content)).toBeTruthy() // has been initialised
      checkFile(filePath, content)
    })

    test('file exists', () => {
      const filePath = '/tmp/test.txt'
      const content = 'test content'
      expect(initFile('/tmp/init.txt', () => content)).toBeFalsy() // already has been initialised
      checkFile(filePath, content) // should be intact
    })
  })

  test('mkdir', () => {
    mkdir('/tmp/work_dir/sub_dir')
    testFile('/tmp/work_dir/sub_dir/test.txt', 'test')
    checkFile('/tmp/work_dir/sub_dir/test.txt', 'test')
  })

  test('getPathBase', () => {
    expect(getPathBase('/dir1/dir2/file.ext')).toStrictEqual('file')
    expect(getPathBase('/dir1/dir2/file.ext', true)).toStrictEqual('file.ext')
    expect(getPathBase('/dir1/dir2')).toStrictEqual('dir2')
  })

  describe('ls', () => {
    test('onlyDir and onlyFile are exclusive', () => {
      expect(() => {
        ls('/tmp/dir', { onlyDir: true, onlyFile: true })
      }).toThrow('onlyDir and onlyFile options can not be set together')
    })

    test('only directory', () => {
      expect(ls('/tmp/dir', { onlyDir: true })).toStrictEqual(['/tmp/dir/sub_dir'])
      expect(ls('/tmp/empty_dir', { onlyDir: true })).toStrictEqual([])
    })

    test('only file', () => {
      expect(ls('/tmp/dir', { onlyFile: true })).toStrictEqual(['/tmp/dir/file1.txt'])
      expect(ls('/tmp/empty_dir', { onlyFile: true })).toStrictEqual([])
    })
  })

  describe('Event', () => {
    test('on / emit', async () => {
      let message = ''

      const o = new Event()
      o.on('message', msg => { message = msg })

      await o.emit('message', 'foobar')
      expect(message).toBe('foobar')
    })
  })
})
