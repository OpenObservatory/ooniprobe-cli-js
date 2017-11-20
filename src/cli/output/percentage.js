const percentage = (r, decimals = 1) =>
    `${Math.floor(r * 10**(decimals+2))/(10**decimals)}%`

module.exports = percentage
