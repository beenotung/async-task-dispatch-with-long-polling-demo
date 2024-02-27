// This file is generated automatically
// Don't edit this file directly

export let server_origin = 'http://localhost:3000'

let api_origin = 'http://localhost:3000/api'

let store = typeof window == 'undefined' ? null : localStorage

let token = store?.getItem('token')

export function getToken() {
  return token
}

export function clearToken() {
  token = null
  store?.removeItem('token')
}

function post(url: string, body: object, token_?: string) {
  return fetch(api_origin + url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token_,
    },
    body: JSON.stringify(body),
  })
    .then(res => res.json())
    .catch(err => ({ error: String(err) }))
    .then(json => {
      if (json.error) {
        return Promise.reject(json.error)
      }
      if (json.token) {
        token = json.token as string
        store?.setItem('token', token)
      }
      return json
    })
}

export type GreetInput = {
  name: string
}
export type GreetOutput = {
  message: string
}
export function greet(input: GreetInput): Promise<GreetOutput & { error?: string }> {
	return post('/greet', input)
}

export type RegisterInput = {
  username: string
  password: string
}
export type RegisterOutput = {
  token: string
}
export function register(input: RegisterInput): Promise<RegisterOutput & { error?: string }> {
	return post('/register', input)
}

export type LoginInput = {
  username: string
  password: string
}
export type LoginOutput = {
  token: string
}
export function login(input: LoginInput): Promise<LoginOutput & { error?: string }> {
	return post('/login', input)
}

export type GetUserListInput = {
}
export type GetUserListOutput = {
  users: Array<{
    id: number
    username: string
    is_admin: boolean
  }>
}
export function getUserList(input: GetUserListInput): Promise<GetUserListOutput & { error?: string }> {
	return post('/getUserList', input)
}

export type GetRecentLogsInput = {
  limit: number
  last_log_id: number
  username: string
}
export type GetRecentLogsOutput = {
  users: Array<{
    id: number
    user_id: number
    username: string
    timestamp: string
    rpc: string
    input: string
  }>
  remains: number
}
export function getRecentLogs(input: GetRecentLogsInput & { token: string }): Promise<GetRecentLogsOutput & { error?: string }> {
  let { token, ...body } = input
	return post('/getRecentLogs', body, token)
}

export type SubmitTaskInput = {
  a: number
  b: number
}
export type SubmitTaskOutput = {
  id: string
}
export function submitTask(input: SubmitTaskInput): Promise<SubmitTaskOutput & { error?: string }> {
	return post('/submitTask', input)
}

export type GetTaskResultInput = {
  id: string
}
export type GetTaskResultOutput = ({
  status: "pending"
} | {
  status: "completed"
  output: {
    c: number
  }
})
export function getTaskResult(input: GetTaskResultInput): Promise<GetTaskResultOutput & { error?: string }> {
	return post('/getTaskResult', input)
}

export type GetTaskForWorkerInput = {
}
export type GetTaskForWorkerOutput = ({
  status: "idle"
} | {
  status: "pending"
  task: {
    id: string
    input: {
      a: number
      b: number
    }
  }
})
export function getTaskForWorker(input: GetTaskForWorkerInput): Promise<GetTaskForWorkerOutput & { error?: string }> {
	return post('/getTaskForWorker', input)
}

export type SubmitTaskResultInput = {
  id: string
  output: {
    c: number
  }
}
export type SubmitTaskResultOutput = {
}
export function submitTaskResult(input: SubmitTaskResultInput): Promise<SubmitTaskResultOutput & { error?: string }> {
	return post('/submitTaskResult', input)
}

export type DeleteTaskInput = {
  id: string
}
export type DeleteTaskOutput = {
}
export function deleteTask(input: DeleteTaskInput): Promise<DeleteTaskOutput & { error?: string }> {
	return post('/deleteTask', input)
}

export type DemoInput = {
}
export type DemoOutput = {
}
export function demo(input: DemoInput): Promise<DemoOutput & { error?: string }> {
	return post('/demo', input)
}
