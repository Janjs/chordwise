import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  apiKey: process.env.OPENAPI_API_KEY,
})

const openai = new OpenAIApi(configuration)

export default openai
