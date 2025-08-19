FROM python:3.11-slim

# Install dependencies for NVM and Node.js
RUN apt-get update && \
    apt-get install -y curl \
    make \
    libglib2.0-0 \ 
    libnss3 \
    libxss1 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libgtk-3-0 \
    && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install NVM
ENV NVM_DIR=/root/.nvm
ENV NVM_VERSION=v0.39.7
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh | bash

# Source NVM script and install Node.js
ENV NODE_VERSION=22.14.0
RUN . "$NVM_DIR/nvm.sh" && \
    nvm install ${NODE_VERSION} && \
    nvm alias default ${NODE_VERSION} && \
    nvm use default && \
    npm install -g pnpm@10.4.1

ENV PATH="/root/.local/bin:${PATH}"
ENV PATH="$NVM_DIR/versions/node/v${NODE_VERSION}/bin:$PATH"
ENV PATH="./node_modules/.bin:$PATH"

# Set working directory
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy application code
COPY . .
RUN pnpm build

# Default command
CMD ["pnpm", "start"]