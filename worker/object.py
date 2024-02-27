user = {
  'id': 1,
  'username': 'alice'
}

print('user:', user)
print('user.id:', user['id'])
# print('user.id:', user.id)

class User():
  def __init__(self, id, username):
    self.id = id
    self.username = username

user = User(1, 'alice')
print('user:', user)
print('user.id:', user['id'])
print('user.id:', user.id)
