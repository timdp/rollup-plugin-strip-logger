import _debug from 'debug'
import {parse} from 'acorn'
import {walk} from 'estree-walker'
import MagicString from 'magic-string'
import {createFilter} from 'rollup-pluginutils'
import {extname} from 'path'
import getPath from './util/get-path'

const debug = _debug('rollup-plugin-strip-logger')

const ACTION_NONE = 0
const ACTION_REMOVE = 1
const ACTION_UPDATE = 2

const createParsers = ({variableName, propertyName, packageName}) => ({
  VariableDeclaration (node) {
    if (variableName == null) {
      return ACTION_NONE
    }
    const name = getPath(node, ['declarations', 0, 'id', 'name'])
    return (name === variableName) ? ACTION_REMOVE : ACTION_NONE
  },

  AssignmentExpression (node) {
    if (propertyName == null && variableName == null) {
      return ACTION_NONE
    }
    const lhs = getPath(node, ['left', 'property', 'name'])
    return ((node.left.type === 'MemberExpression') ? (lhs === propertyName) : (lhs === variableName))
      ? ACTION_REMOVE : ACTION_NONE
  },

  ExpressionStatement (node) {
    if (propertyName == null && variableName == null) {
      return ACTION_NONE
    }
    return (
        getPath(node, ['expression', 'callee', 'object', 'property', 'name']) === propertyName ||
        getPath(node, ['expression', 'callee', 'object', 'name']) === variableName
      ) ? ACTION_REMOVE : ACTION_NONE
  },

  ImportDeclaration (node) {
    if (packageName == null) {
      return ACTION_NONE
    }
    const src = getPath(node, ['source', 'value'])
    return (src === packageName) ? ACTION_REMOVE : ACTION_NONE
  },

  ReturnStatement (node) {
    // TODO Support return obj[propertyName]
    if (variableName == null) {
      return ACTION_NONE
    }
    const arg = getPath(node, ['argument', 'name'])
    if (arg === variableName) {
      node.argument = null
      return ACTION_UPDATE
    } else {
      return ACTION_NONE
    }
  }
})

export default (options = {}) => {
  const filter = createFilter(options.include, options.exclude)
  const parsers = createParsers(options)
  return {
    name: 'strip-logger',

    transform (code, id) {
      if (!filter(id) || extname(id) !== '.js') {
        return null
      }
      const magicString = new MagicString(code)
      const ast = parse(code, {ecmaVersion: 6, sourceType: 'module'})
      let changed = false
      walk(ast, {
        enter (node, parent) {
          if (parsers[node.type] == null) {
            return
          }
          const result = parsers[node.type](node)
          if (result === ACTION_NONE) {
            return
          }
          if (result === ACTION_REMOVE) {
            debug('Removing: ' + magicString.slice(node.start, node.end))
            magicString.remove(node.start, node.end)
          } else if (result === ACTION_UPDATE) {
            debug('Updated: ' + magicString.slice(node.start, node.end))
          }
          changed = true
          this.skip()
        }
      })
      return !changed ? null : {
        code: magicString.toString(),
        map: magicString.generateMap()
      }
    }
  }
}
