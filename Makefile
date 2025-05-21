# Spelling Game Makefile

# Variables
PYTHON = python3
PORT = 8000
NPM = npm

# Default target
all: setup build

# Setup environment
setup:
	@echo "Setting up environment..."
	$(NPM) install
	@echo "Environment setup complete!"

# Build TypeScript files
build:
	@echo "Building TypeScript files..."
	$(NPM) run build
	@echo "Build complete!"

# Watch TypeScript files for changes
watch:
	@echo "Watching TypeScript files for changes..."
	$(NPM) run watch

# Start development server
dev: build
	@if [ -z "$(ELEVENLABS_API_KEY)" ]; then \
	  echo "Error: ELEVENLABS_API_KEY environment variable is required."; \
	  exit 1; \
	fi
	@echo "window.ELEVENLABS_API_KEY = \"$(ELEVENLABS_API_KEY)\";" > dist/elevenlabs-key.js
	$(PYTHON) -m http.server $(PORT)
	@echo "Server started at http://localhost:$(PORT)"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist/
	@echo "Clean complete!"

# Run the game (build + start server)
run: build
	@if [ -z "$(ELEVENLABS_API_KEY)" ]; then \
	  echo "Error: ELEVENLABS_API_KEY environment variable is required."; \
	  exit 1; \
	fi
	@echo "window.ELEVENLABS_API_KEY = \"$(ELEVENLABS_API_KEY)\";" > dist/elevenlabs-key.js
	$(PYTHON) -m http.server $(PORT)

# Help target
help:
	@echo "Available targets:"
	@echo "  setup    - Install dependencies"
	@echo "  build    - Build TypeScript files"
	@echo "  watch    - Watch TypeScript files for changes"
	@echo "  dev      - Start development server"
	@echo "  clean    - Remove build artifacts"
	@echo "  run      - Build and start the game"
	@echo "  help     - Show this help message"

.PHONY: all setup build watch dev clean run help 