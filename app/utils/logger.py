"""Logging configuration for the application."""

import logging
import os
from datetime import datetime
from typing import Dict

# Dictionary to store logger instances
_loggers: Dict[str, logging.Logger] = {}
_is_initialized = False

def setup_logging() -> None:
    """Configure logging for the application"""
    global _is_initialized
    
    if _is_initialized:
        return
        
    # Create logs directory if it doesn't exist
    os.makedirs("logs", exist_ok=True)
    
    # Create a timestamp for the log file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = f"logs/app_{timestamp}.log"
    
    # Configure logging
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()  # Also print to console
        ],
        force=True  # Force reconfiguration
    )
    
    _is_initialized = True

def get_logger(name: str = __name__) -> logging.Logger:
    """Get a logger instance for the given name.
    
    Args:
        name: The name of the logger (usually __name__)
        
    Returns:
        A configured logger instance
    """
    if name not in _loggers:
        setup_logging()
        _loggers[name] = logging.getLogger(name)
    
    return _loggers[name]

# Initialize the default logger
default_logger = get_logger(__name__)

# Export the get_logger function
__all__ = ['get_logger']
