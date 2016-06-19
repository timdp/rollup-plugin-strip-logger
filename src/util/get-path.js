export default (obj, path) => {
  for (const key of path) {
    if (obj == null || typeof obj[key] === 'undefined') {
      return null
    }
    obj = obj[key]
  }
  return obj
}
