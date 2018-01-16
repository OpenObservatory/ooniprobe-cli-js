import chalk from 'chalk'
import moment from 'moment'
import humanize from 'humanize'

import rightPad from './right-pad'
import labelValue from './label-value'
/*
 * The results array is a list of:
  {
    "name": "Web Censorship",
    "date": "20170101T154800Z",
    "asn": "AS100",
    "network": "Vodafone Italia",
    "summary": [
      "Row 1",
      "Row 2"
    ],
    "icon": ""
  }
 */
/*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ #1 - 12:30, 23rd October 2017                ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ Web Censorship            13 Blocked         │
│ Vodafone Italia           10 sites           │
│ AS 1234 (IT)                                 │
┢━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┪
┃ #2 - 12:30, 23rd October 2017                ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ NDT                       Down: 15.97 Mbit/s │
│ Vodafone Italia           Up: 11.42 Mbit/s   │
│ AS 1234 (IT)              Ping: 11.42 ms     │
┢━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┪
┃ #3 - 12:30, 23rd October 2017                ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ NDT                       Down: 15.97 Mbit/s │
│ Vodafone Italia           Up: 11.42 Mbit/s   │
│ AS 1234 (IT)              Ping: 11.42 ms     │
┢━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┪
┃ #4 - 12:30, 23rd October 2017                ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ NDT                       Down: 15.97 Mbit/s │
│ Vodafone Italia           Up: 11.42 Mbit/s   │
│ AS 1234 (IT)              Ping: 11.42 ms     │
┢━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┪
┃ #5   15:30, 23rd October 2017                ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ NDT                       Down: 15.97 Mbit/s │
│ Vodafone Italia           Up: 11.42 Mbit/s   │
│ AS 1234 (IT)              Ping: 11.42 ms     │
└┬──────────────┬──────────────┬──────────────┬┘
 │  132 tests   │ 22 networks  │    128 MB    │
 ╰──────────────┴──────────────┴──────────────╯
*/

const testResults = async (results, getMeta) => {
  const colWidth = 76
  let o = '┏' + '━'.repeat(colWidth) + '┓\n'
  let totalDataUsageUp = 0
  let totalDataUsageDown = 0
  let totalRows = 0
  let allAsns = []
  let allCountries = []

  const getContentRow = async (r) => {
    let innerWidth = colWidth - 2
    let rows = []
    const meta = await getMeta(r)

    /*
     * This should return:
     * {
     *  name, network, date, country, summary, dataUsage
     * }
     */
    if (allCountries.indexOf(meta.country) === -1) {
      allCountries.push(meta.country)
    }
    if (allAsns.indexOf(meta.asn) === -1) {
      allAsns.push(meta.asn)
    }
    if (meta.dataUsageUp && meta.dataUsageDown) {
      totalDataUsageUp += meta.dataUsageUp
      totalDataUsageDown += meta.dataUsageDown
    }
    totalRows += 1

    let firstRow = `${chalk.bold(`#${r.id}`)} - ${moment(meta.date).fromNow()}`
    firstRow += rightPad(firstRow, innerWidth)
    let secondRow = meta.name
    secondRow += rightPad(secondRow, colWidth/2)
    secondRow += meta.summary[0] || ''
    secondRow += rightPad(secondRow, innerWidth)

    let thirdRow = meta.network
    thirdRow += rightPad(thirdRow, colWidth/2)
    thirdRow += meta.summary[1] || ''
    thirdRow += rightPad(thirdRow, innerWidth)

    let fourthRow = `${chalk.cyan(meta.asn)} (${chalk.cyan(meta.country)})`
    fourthRow += rightPad(fourthRow, colWidth/2)
    fourthRow += meta.summary[2] || ''
    fourthRow += rightPad(fourthRow, innerWidth)

    rows.push(`┃ ${firstRow} ┃`)
    rows.push('┡' + '━'.repeat(colWidth) + '┩')
    rows.push(`│ ${secondRow} │`)
    rows.push(`│ ${thirdRow} │`)
    rows.push(`│ ${fourthRow} │`)
    return rows.join('\n')+'\n'
  }
  const contentRows = await Promise.all(
    results.map(getContentRow)
  )

  let dataUsageDownCell = `U ${humanize.filesize(totalDataUsageDown)}`
  dataUsageDownCell += rightPad(dataUsageDownCell, 12)

  let dataUsageUpCell = `D ${humanize.filesize(totalDataUsageUp)}`
  dataUsageUpCell += rightPad(dataUsageUpCell, 12)

  let networksCell = `${allAsns.length} nets`
  networksCell += rightPad(networksCell, 12)

  let msmtsCell = `${totalRows} entries`
  msmtsCell += rightPad(msmtsCell, 12)

  o += contentRows.join('┢' + '━'.repeat(colWidth) + '┪\n')

  if (totalDataUsageDown && totalDataUsageUp) {
    o += '└┬──────────────┬──────────────┬──────────────┬──────────────┬'+'─'.repeat(colWidth - 61)+'┘\n'
    o += ` │ ${msmtsCell} │ ${networksCell} │ ${dataUsageDownCell} │ ${dataUsageUpCell} │\n`
    o += ' ╰──────────────┴──────────────┴──────────────┴──────────────╯'
  } else {
    o += '└┬──────────────┬──────────────┬'+'─'.repeat(colWidth - 31)+'┘\n'
    o += ` │ ${msmtsCell} │ ${networksCell} │\n`
    o += ' ╰──────────────┴──────────────╯'
  }
  return o
}

export default testResults
