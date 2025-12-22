# Use the official Puppeteer image which includes Chrome and dependencies
# This matches the package.json puppeteer version roughly or uses a stable recent one
FROM ghcr.io/puppeteer/puppeteer:21.5.0

# Set working directory
WORKDIR /usr/src/app

# Switch to root to install dependencies (if needed) or just file permissions
# The puppeteer image runs as 'pptruser' by default, but we need to copy files as root first
USER root

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
# --omit=dev to keep it production ready
# --ignore-scripts to prevent some post-install scripts that might fail (though puppeteer sometimes needs them unless skipped)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

RUN npm ci --omit=dev

# Copy app source
COPY . .

# Fix permissions for the pptruser
RUN chown -R pptruser:pptruser /usr/src/app

# Run everything after as non-privileged user
USER pptruser

# Expose port
EXPOSE 5000

# Start the application
# We use dumb-init (included in the base image) to handle signals correctly
CMD ["dumb-init", "node", "server.js"]
