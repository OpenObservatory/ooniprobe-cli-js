import chalk from 'chalk'
import moment from 'moment'

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

const testResults = (results, msmtsCount, networkCount, dataUsage, summaryFormat) => {
  const colWidth = 50
  let o = '┏' + '━'.repeat(colWidth) + '┓\n'
  let contentRows = results
            .map(r => {
              let innerWidth = colWidth - 2
              let rows = []
              const summary = summaryFormat(r.summary)
              //.map(s => {
              //  return labelValue(s.label, s.value, {unit: s.unit})
              //})
              let firstRow = `${chalk.bold(`#${r.id}`)} - ${moment(r.date).fromNow()}`
              firstRow += rightPad(firstRow, innerWidth)
              let secondRow = r.name
              secondRow += rightPad(secondRow, 26)
              secondRow += summary[0] || ''
              secondRow += rightPad(secondRow, innerWidth)

              let thirdRow = 'Vodafone Italia'
              thirdRow += rightPad(thirdRow, 26)
              thirdRow += summary[1] || ''
              thirdRow += rightPad(thirdRow, innerWidth)

              let fourthRow = `${chalk.cyan(r.asn)} (${chalk.cyan(r.country)})`
              fourthRow += rightPad(fourthRow, 26)
              fourthRow += summary[2] || ''
              fourthRow += rightPad(fourthRow, innerWidth)

              rows.push(`┃ ${firstRow} ┃`)
              rows.push('┡' + '━'.repeat(colWidth) + '┩')
              rows.push(`│ ${secondRow} │`)
              rows.push(`│ ${thirdRow} │`)
              rows.push(`│ ${fourthRow} │`)
              return rows.join('\n')+'\n'
            })
  let dataUsageCell = `${dataUsage}`
  dataUsageCell += rightPad(dataUsageCell, 12)

  let networksCell = `${networkCount} nets`
  networksCell += rightPad(networksCell, 12)

  let msmtsCell = `${msmtsCount} msmts`
  msmtsCell += rightPad(msmtsCell, 12)

  o += contentRows.join('┢' + '━'.repeat(colWidth) + '┪\n')
  o += '└┬──────────────┬──────────────┬──────────────┬'+'─'.repeat(colWidth - 46)+'┘\n'
  o += ` │ ${msmtsCell} │ ${networksCell} │ ${dataUsageCell} │
 ╰──────────────┴──────────────┴──────────────╯
`
  return o
}

export default testResults
