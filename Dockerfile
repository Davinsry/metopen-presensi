FROM node:20-alpine

WORKDIR /app

# Install openssl for prisma engine to run on alpine
RUN apk add --no-cache openssl

# Copy package info
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV DATABASE_URL="file:./prisma/dev.db"

# Start the application
CMD ["npm", "run", "start"]
