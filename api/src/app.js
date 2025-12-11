import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import appointmentsRouter from './routes/appointments.js'
import customersRouter from './routes/customers.js'
import servicesRouter from './routes/services.js'

dotenv.config()

const app = express()

const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(',').map((entry) => entry.trim()).filter(Boolean) || []

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin?.endsWith('.ngrok-free.app')) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    }
  })
)

app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/appointments', appointmentsRouter)
app.use('/customers', customersRouter)
app.use('/services', servicesRouter)

export default app
