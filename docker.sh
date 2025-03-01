#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running${NC}"
        exit 1
    fi
}

# Function to show container stats
show_stats() {
    echo -e "${BLUE}Container Stats:${NC}"
    docker stats --no-stream
}

# Function to show container logs
show_logs() {
    local service=$1
    echo -e "${BLUE}Logs for $service:${NC}"
    docker-compose logs --tail=100 $service
}

# Function to check container health
check_health() {
    echo -e "${BLUE}Checking container health...${NC}"
    docker-compose ps
}

# Function to start services
start_services() {
    echo -e "${BLUE}Starting services...${NC}"
    docker-compose up --build -d
    
    echo -e "${BLUE}Waiting for services to be healthy...${NC}"
    sleep 10
    check_health
    
    echo -e "${GREEN}Services are running at:${NC}"
    echo -e "Backend: ${BLUE}http://localhost:8000${NC}"
    echo -e "Frontend: ${BLUE}http://localhost:3000${NC}"
    echo -e "API Docs: ${BLUE}http://localhost:8000/docs${NC}"
}

# Function to stop services
stop_services() {
    echo -e "${BLUE}Stopping services...${NC}"
    docker-compose down
}

# Function to restart services
restart_services() {
    stop_services
    start_services
}

# Function to clean up
cleanup() {
    echo -e "${BLUE}Cleaning up...${NC}"
    docker-compose down -v
    docker system prune -f
}

# Main script
check_docker

case "$1" in
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "stats")
        show_stats
        ;;
    "logs")
        if [ -z "$2" ]; then
            echo -e "${RED}Please specify a service (backend/frontend)${NC}"
            exit 1
        fi
        show_logs $2
        ;;
    "health")
        check_health
        ;;
    "clean")
        cleanup
        ;;
    *)
        echo -e "${BLUE}Usage: $0 {start|stop|restart|stats|logs|health|clean}${NC}"
        echo -e "  start   - Start all services"
        echo -e "  stop    - Stop all services"
        echo -e "  restart - Restart all services"
        echo -e "  stats   - Show container stats"
        echo -e "  logs    - Show container logs (requires service name)"
        echo -e "  health  - Check container health"
        echo -e "  clean   - Clean up containers and volumes"
        exit 1
        ;;
esac 