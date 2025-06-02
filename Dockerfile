FROM oven/bun:1.1

WORKDIR /app

COPY package.json ./
RUN bun install
COPY . .

# Expose the port
EXPOSE 3030

# Start the application
CMD ["bun", "dev"]