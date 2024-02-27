import { find, Table } from 'better-sqlite3-proxy'
import {
  array,
  boolean,
  id,
  int,
  literal,
  nullable,
  object,
  optional,
  or,
  ParseResult,
  string,
} from 'cast.ts'
import httpStatus from 'http-status'
import { defModule } from './api'
import { db } from './db'
import { HttpError } from './error'
import { comparePassword, hashPassword } from './hash'
import { encodeJWT, JWTPayload } from './jwt'
import { proxy, User } from './proxy'
import { LongPollingTaskQueue } from 'express-long-polling'

let core = defModule()
let { defAPI } = core

defAPI({
  name: 'greet',
  sampleInput: { name: 'world' },
  sampleOutput: { message: 'hello world' },
  fn(input) {
    return { message: 'hello ' + input.name }
  },
})

let authParser = object({
  username: string({ minLength: 1, maxLength: 32, sampleValue: 'alice' }),
  password: string({ minLength: 6, maxLength: 256, sampleValue: 'secret' }),
})

defAPI({
  name: 'register',
  inputParser: authParser,
  sampleOutput: { token: 'a-jwt-string' },
  fn: async input => {
    let user = find(proxy.user, { username: input.username })
    if (user)
      throw new HttpError(
        httpStatus.CONFLICT,
        'this username is already in use',
      )
    let id = proxy.user.push({
      username: input.username,
      password_hash: await hashPassword(input.password),
      is_admin: false,
    })
    let token = encodeJWT({ id, is_admin: false })
    return { token }
  },
})

defAPI({
  name: 'login',
  inputParser: authParser,
  sampleOutput: { token: 'a-jwt-string' },
  async fn(input) {
    let user = find(proxy.user, { username: input.username })
    if (!user) throw new HttpError(404, 'this username is not used')
    let matched = await comparePassword({
      password: input.password,
      password_hash: user.password_hash,
    })
    if (!matched)
      throw new HttpError(httpStatus.UNAUTHORIZED, 'wrong username or password')
    let token = encodeJWT({ id: user.id!, is_admin: user.is_admin })
    return { token }
  },
})

defAPI({
  name: 'getUserList',
  outputParser: object({
    users: array(
      object({
        id: id(),
        username: string(),
        is_admin: boolean(),
      }),
    ),
  }),
  fn() {
    return { users: proxy.user as Table<User> }
  },
})

let select_recent_log = db.prepare(/* sql */ `
select
  log.id
, log.user_id
, user.username
, log.created_at as timestamp
, log.rpc
, log.input
from user
inner join log on log.user_id = user.id
where user.username like :username
  and log.id < :last_log_id
order by log.id desc
limit :limit
`)
let count_recent_log = db
  .prepare(
    /* sql */ `
select
  count(*) as count
from user
inner join log on log.user_id = user.id
where user.username like :username
  and log.id < :last_log_id
`,
  )
  .pluck()
defAPI({
  name: 'getRecentLogs',
  jwt: true,
  role: 'admin',
  sampleInput: { limit: 5, last_log_id: 0, username: 'alice' },
  sampleOutput: {
    users: [
      {
        id: 1,
        user_id: 1,
        username: 'alice',
        timestamp: '2023-03-29 08:00:00',
        rpc: 'getRecentUserList',
        input: '{"keyword":"alice"}',
      },
    ],
    remains: 3,
  },
  fn(input, jwt) {
    let users = select_recent_log.all({
      username: '%' + input.username + '%',
      last_log_id: input.last_log_id,
      limit: Math.min(25, input.limit),
    })
    let remains = count_recent_log.get({
      username: '%' + input.username + '%',
      last_log_id: input.last_log_id,
    }) as number
    remains -= users.length
    return { users, remains }
  },
})

type TaskInput = { a: number; b: number }
type TaskOutput = { c: number }

let taskQueue = new LongPollingTaskQueue<TaskInput, TaskOutput>({
  pollingInterval: 5 * 1000,
})

defAPI({
  name: 'submitTask',
  inputParser: object({
    a: int(),
    b: int(),
  }),
  outputParser: object({ id: string() }),
  fn(input) {
    let { id } = taskQueue.addTask({ input: input })
    return { id }
  },
})

let getTaskResultOutputParser = or([
  object({ status: literal('pending') }),
  object({ status: literal('completed'), output: object({ c: int() }) }),
])
type GetTaskResultOutput = ParseResult<typeof getTaskResultOutputParser>

defAPI({
  name: 'getTaskResult',
  inputParser: object({ id: string() }),

  // outputParser: object({
  //   status: string(),
  //   output: optional(object({ c: int() })),
  // }),

  outputParser: getTaskResultOutputParser,

  fn(input, req) {
    return new Promise<GetTaskResultOutput>((resolve, reject) => {
      try {
        taskQueue.getOrWaitResult(
          input.id,
          req,
          output => {
            resolve({ status: 'completed', output })
          },
          timeout => {
            resolve({ status: 'pending' })
          },
        )
      } catch (error) {
        reject(error)
      }
    })
  },
})

let getTaskForWorkerOutputParser = or([
  object({ status: literal('idle') }),
  object({
    status: literal('pending'),
    task: object({ id: string(), input: object({ a: int(), b: int() }) }),
  }),
])
type GetTaskForWorkerOutput = ParseResult<typeof getTaskForWorkerOutputParser>

defAPI({
  name: 'getTaskForWorker',
  outputParser: getTaskForWorkerOutputParser,
  fn(input, req) {
    return new Promise<GetTaskForWorkerOutput>(resolve => {
      taskQueue.getOrWaitTask(
        'random',
        req,
        task => resolve({ status: 'pending', task }),
        timeout => resolve({ status: 'idle' }),
      )
    })
  },
})

defAPI({
  name: 'submitTaskResult',
  inputParser: object({
    id: string(),
    output: object({ c: int() }),
  }),
  fn(input, req) {
    let found = taskQueue.dispatchResult(input.id, input.output)
    console.log('dispatch task result:', { found })
    return {}
  },
})

defAPI({
  name: 'deleteTask',
  inputParser: object({ id: string() }),
  fn(input, req) {
    taskQueue.deleteTask(input.id)
    return {}
  },
})

// a shorter api for easy copy-paste into new APIs
defAPI({
  name: 'demo',
  // sampleInput: {},
  // sampleOutput: {},
  // inputParser: object({}),
  // outputParser: object({}),
  // fn(input) {
  //   return {  }
  // },
})

core.saveSDK()

export default core
