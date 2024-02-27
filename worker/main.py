import time
import requests

api_origin = 'http://localhost:3000/api'

def get_task_for_worker():
  while True:
    print("get_task_for_worker() ...")
    response = requests.post(api_origin+'/getTaskForWorker')
    data = response.json()
    if data['status'] == 'pending':
      return data['task']
    if data['status'] == 'idle':
      continue
    print("unexpected response json:", data)
    raise Exception('unexpected response')

def handle_task(input):
  print('handle_task()', input)
  a = input['a']
  b = input['b']
  time.sleep(2)
  c = a + b
  return {
    'c': c
  }


def submit_task_result(id, output):
  data = {
    'id': id,
    'output': output
  }
  print("submit_task_result()", data)
  response = requests.post(
    url=api_origin+'/submitTaskResult',
    json=data
  )
  data = response.json()
  if 'error' in data:
    raise Exception(data['error'])

def main():
  while True:
    print("main() ...")
    task = get_task_for_worker()
    output = handle_task(task['input'])
    submit_task_result(task['id'], output)

  
main()
