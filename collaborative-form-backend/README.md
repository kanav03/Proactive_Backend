# Collaborative Form Backend

Backend service for the collaborative form filling application.

## Deployment to Render

### Prerequisites

1. Create a [Render](https://render.com/) account
2. Have a MongoDB database ready (Atlas or other MongoDB provider)

### Deployment Steps

1. Fork or push this repository to your GitHub account
2. Log in to your Render account
3. Click "New" and select "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: collaborative-form-backend (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select appropriate plan (Free tier works for development)

6. Add the following environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string for JWT token signing
   - `NODE_ENV`: production
   - `ALLOWED_ORIGINS`: The URL of your frontend (e.g., https://your-app.vercel.app)

7. Click "Create Web Service"

### After Deployment

1. Note the URL of your Render service (e.g., https://collaborative-form-backend.onrender.com)
2. Update your frontend environment variables in Vercel:
   - `REACT_APP_API_URL`: https://collaborative-form-backend.onrender.com/api
   - `REACT_APP_SOCKET_URL`: https://collaborative-form-backend.onrender.com

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `env.example`
4. Run the development server: `npm run dev`

The server will be available at http://localhost:5001 by default. 