
# Use the official Playwright image which comes with all browser dependencies pre-installed
# This is crucial because standard Node images won't run the scraper
FROM mcr.microsoft.com/playwright:v1.45.0-jammy

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the listening port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
