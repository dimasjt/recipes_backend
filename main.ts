import { Application, Router } from 'https://deno.land/x/oak/mod.ts'
import { init, MongoClient, ObjectId } from "https://deno.land/x/mongo@v0.6.0/mod.ts";

await init()

const app = new Application()
const router = new Router()
const client = new MongoClient();

client.connectWithUri("mongodb://localhost:27017");

const db = client.database("recipes_dev");
const recipes = db.collection("recipes");

router.get('/', ctx => {
  ctx.response.body = {
    "hello": "world"
  }
})

router.get('/recipes', async ctx => {
  const listRecipes = await recipes.find()

  ctx.response.body = {
    data: listRecipes
  }
})

router.get('/recipes/:id', async ({ params, response }) => {
  if (params?.id)  {
    const id = ObjectId(params.id)
    const recipe = await recipes.findOne({ _id: id })

    response.body = {
      data: recipe,
    }
  }
})

router.post('/recipes', async ({ request, response }) => {
  if (request.hasBody) {
    const { value, type } = await request.body()
    if (type === 'json') {
      const insertId = await recipes.insertOne(value)
      const recipe = await recipes.findOne({ _id: insertId })

      response.body = {
        data: {
          ...recipe
        },
        message: 'Recipe successfully created'
      }
      response.status = 201
    } else {
      response.status = 422
    }
  } else {
    response.status = 422
  }
})

router.put('/recipes/:id', async ({ request, response, params }) => {
  if (params?.id) {
    const id = ObjectId(params.id)
    const { value, type } = await request.body()

    if (type === 'json') {
      const { matchedCount, modifiedCount, upsertedId } = await recipes.updateOne(
        { _id: id },
        { $set: value }
      )

      if (modifiedCount > 0 && matchedCount > 0) {
        const recipe = await recipes.findOne({ id: upsertedId })

        response.body = {
          data: recipe,
          message: 'Recipe successfully updated'
        }
      } else if (matchedCount === 0) {
        response.body = {
          message: 'Recipe not found'
        }
        response.status = 404
      } else {
        response.body = {
          message: 'Recipe failed to update,'
        }
        response.status = 422
      }
    }
  }
})

router.delete('/recipes/:id', async ({ params, response }) => {
  if (params?.id) {
    const id = ObjectId(params.id)
    const deleteCount = await recipes.deleteOne({ _id: id })

    if (deleteCount > 0) {
      response.body = {
        message: "Recipe successfully deleted"
      }
    } else {
      response.status = 404
      response.body = {
        message: "Recipe not found"
      }
    }
  }
})

app.use(router.routes())
app.use(router.allowedMethods())

await app.listen({ port: 8000 })