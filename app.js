const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())
const dbpath = path.join(__dirname, 'todoApplication.db')

let db = null

const initialization = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}

initialization()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let getTodoquery = ''
  const {search_q = '', priority, status} = request.query
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoquery = `
        SELECT
          *
        FROM
         todo
        WHERE
          todo LIKE "%${search_q}%",
          AND status = '${status}',
          AND priority = '${priority}';
        `
      break
    case hasPriorityProperty(request.query):
      getTodoquery = `
        SELECT
          *
        FROM
         todo
        WHERE
          todo LIKE "%${search_q}"
          AND priority = '${priority}';
        `
      break
    case hasStatusProperty(request.query):
      getTodoquery = `
        SELECT
          *
        FROM
         todo
        WHERE
          todo LIKE "%${search_q}"
          AND status = '${status}';
        `
      break
    default:
      getTodoquery = `
       SELECT
        *
       FROM
       todo
       WHERE
        todo LIKE "${search_q}%";
       `
  }
  data = await db.all(getTodoquery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getTodoquery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`
  const todo = await db.get(getTodoquery)
  response.send(todo)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postTodo = `
  INSERT INTO
    todo (id ,todo ,priority ,status)
  VALUES
    (${id},'${todo}','${priority}','${status}')`
  await db.run(postTodo)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority != undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'

      break
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
       id=${todoId};`
  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body

  const updateQuery = `
     UPDATE
       todo
     SET
       todo = '${todo}',
       priority = '${priority}',
       status = '${status}'
     WHERE
        id = ${todoId}`

  await db.run(updateQuery)
  response.send(`${updateColumn} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`

  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
