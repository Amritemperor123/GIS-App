import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import authRoutes from './routes/auth';
import jobRoutes from './routes/jobs';
import notificationRoutes from './routes/notifications';
import userRoutes from './routes/users';
import imagesRoutes from './routes/images';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true, parameterLimit: 50000 }));


// Serve static files from the 'uploads' directory
app.use('/db/images', express.static(path.join(__dirname, 'db/images')));

// Root endpoint
app.get('/', (req, res) => {
  res.send('GIS App Backend is running!');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/images', imagesRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
