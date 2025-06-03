# Use Bun's official image
FROM oven/bun:1.1.8

# Set working directory
WORKDIR /app

# Copy Bun config and source code
COPY . .

# Install dependencies using Bun
RUN bun install --frozen-lockfile

# Expose the port your Hono app listens on
EXPOSE 8558

# Start the app
CMD ["bun", "src/index.ts"]
