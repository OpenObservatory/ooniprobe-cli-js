import inquirer from 'inquirer'

const promptList = async ({
  message = 'the question',
  choices = [
    {
      name: 'foo\nbar',
      value: 'unique-id',
      short: 'first line of name'
    }
  ],
  pageSize = 15
}) => {
  const nonce = Date.now()
  const answer = await inquirer.prompt({
    name: nonce,
    type: 'list',
    message,
    choices,
    pageSize
  })
  return answer[nonce]
}
export default promptList
