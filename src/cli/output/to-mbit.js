export const toMbit = (kbit) => {
  if (typeof kbit === 'string') {
    kbit = parseFloat(kbit)
  }
  return Math.round(kbit/1024*100)/100
}
export default toMbit
