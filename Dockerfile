# Step 1: Build frontend (Vite/React)
FROM node:18 AS frontend
WORKDIR /app
COPY client ./client
WORKDIR /app/client
RUN npm install && npm run build

# Step 2: Set up backend (FastAPI)
FROM python:3.11 AS backend
WORKDIR /app
COPY server ./server
WORKDIR /app/server
COPY server/requirements.txt .
RUN pip install -r requirements.txt

# Step 3: Production image (Nginx)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend /app/client/dist /usr/share/nginx/html
COPY --from=backend /app/server /app/server

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
