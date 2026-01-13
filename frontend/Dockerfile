FROM node:20-alpine

WORKDIR /app/frontend

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy application code
COPY . .

# Expose ports for app and Node.js inspect
EXPOSE 3000
EXPOSE 9229

# Run the application with Node.js inspect enabled
CMD ["yarn", "start"]
