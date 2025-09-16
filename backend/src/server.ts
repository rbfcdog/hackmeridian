import app from './app';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
