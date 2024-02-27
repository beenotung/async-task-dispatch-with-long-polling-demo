import {
  deleteTask,
  getRecentLogs,
  getTaskResult,
  getToken,
  getUserList,
  login,
  submitTask,
} from '../src/sdk'
import { ask } from 'npm-init-helper'

async function process(input: { a: number; b: number }) {
  console.log('submit task...')
  let { id } = await submitTask(input)
  console.log('task id:', id)
  while (true) {
    console.log('get task result...')
    let result = await getTaskResult({ id })
    console.log('result:', result)
    if (result.status == 'pending') {
      continue
    }
    if (result.status == 'completed') {
      console.log('task output:', result.output)
      await deleteTask({ id })
      return result.output
    }
    console.log('unexpected response:', result)
    throw new Error('unexpected response')
  }
}

async function main() {
  let a = await ask('a: ')
  let b = await ask('b: ')
  console.log('process...')
  let { c } = await process({ a: +a, b: +b })
  console.log({ c })
}

main().catch(e => console.error(e))
