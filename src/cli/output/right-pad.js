import stringLength from 'string-length'

export const rightPad = (s, n) => {
  n -= stringLength(s)
  return ' '.repeat(n > -1 ? n : 0)
}

export default rightPad
