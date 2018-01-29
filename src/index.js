import _debug from 'debug'
import {parse} from 'acorn'
import {walk} from 'estree-walker'
import MagicString from 'magic-string'
import {createFilter} from 'rollup-pluginutils'
import getPath from 'lodash.get'
import {extname} from 'path'

const debug = _debug('rollup-plugin-strip-logger')

const ACTION_NONE = 0
const ACTION_REMOVE = 1
const ACTION_UPDATE = 2

const createVisitors = ({variableNames, propertyNames, packageNames}) => {
  variableNames = variableNames || []
  propertyNames = propertyNames || []
  packageNames = packageNames || []
  const noop = () => ACTION_NONE
  const noVars = (variableNames.length === 0)
  const noVarsOrProps = (noVars && propertyNames.length === 0)
  const noPackages = (packageNames.length === 0)
  return {
    VariableDeclaration: noVars ? noop : node => {
      const name = getPath(node, ['declarations', 0, 'id', 'name'])
      return variableNames.indexOf(name) < 0 ? ACTION_NONE : ACTION_REMOVE
    },
    AssignmentExpression: noVarsOrProps ? noop : node => {
      const lhs = getPath(node, ['left', 'property', 'name'])
      const names = (node.left.type === 'MemberExpression') ? propertyNames : variableNames
      return names.indexOf(lhs) < 0
        ? ACTION_NONE : ACTION_REMOVE
    },
    ExpressionStatement: noVarsOrProps ? noop : node => {
      return (
        propertyNames.indexOf(getPath(node, ['expression', 'callee', 'object', 'property', 'name'])) < 0 &&
        variableNames.indexOf(getPath(node, ['expression', 'callee', 'object', 'name'])) < 0
      ) ? ACTION_NONE : ACTION_REMOVE
    },
    ImportDeclaration: noPackages ? noop : node => {
      const src = getPath(node, ['source', 'value'])
      return packageNames.indexOf(src) < 0 ? ACTION_NONE : ACTION_REMOVE
    },
    ReturnStatement: noVars ? noop : node => {
      const arg = getPath(node, ['argument', 'name'])
      if (variableNames.indexOf(arg) < 0) {
        return ACTION_NONE
      } else {
        node.argument = null
        return ACTION_UPDATE
      }
    }
  }
}

export default (options = {}) => {
  const filter = createFilter(options.include, options.exclude)
  const visitors = createVisitors(options)
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
          if (visitors[node.type] == null) {
            return
          }
          const result = visitors[node.type](node)
          if (result === ACTION_NONE) {
            return
          }
          if (result === ACTION_REMOVE) {
            if (debug.enabled) {
              debug('Removing: ' + magicString.slice(node.start, node.end))
            }
            magicString.remove(node.start, node.end)
          } else if (result === ACTION_UPDATE) {
            if (debug.enabled) {
              debug('Updated: ' + magicString.slice(node.start, node.end))
            }
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
