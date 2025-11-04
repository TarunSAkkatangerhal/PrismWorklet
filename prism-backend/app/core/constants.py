"""
Centralized constants for the application
This ensures consistency across the codebase
"""

# Worklet Status Mapping (Database ID to Display Text)
# Canonical spelling: "Ongoing" (not "On Going")
WORKLET_STATUS_MAP = {
    0: "To Start",
    1: "Ongoing",      # Normalized spelling
    2: "Completed",
    3: "On Hold",
    4: "Dropped"
}

# Reverse mapping for status text to ID
WORKLET_STATUS_REVERSE_MAP = {
    "To Start": 0,
    "Ongoing": 1,
    "On Going": 1,     # Accept legacy spelling
    "Completed": 2,
    "On Hold": 3,
    "Dropped": 4
}

# Default status
DEFAULT_WORKLET_STATUS_ID = 1  # Ongoing

# Performance Mapping (Database ID/Number to Display Text)
PERFORMANCE_MAP = {
    0: "NA",
    1: "Poor",
    2: "Average",
    3: "Good",
    4: "Very Good",
    5: "Very Good"
}

# Reverse mapping for performance text to ID
PERFORMANCE_REVERSE_MAP = {
    "NA": 0,
    "Poor": 1,
    "Average": 2,
    "Good": 3,
    "Very Good": 4
}

# Risk Status Mapping (Database Integer to Display Text)
# 0=Grey(NA), 1=Red(High), 2=Amber(Medium), 3=Green(Safe)
RISK_STATUS_MAP = {
    0: "NA",
    1: "High",
    2: "Medium",
    3: "Safe"
}

# Reverse mapping for risk status text to ID
RISK_STATUS_REVERSE_MAP = {
    "NA": 0,
    "High": 1,
    "Medium": 2,
    "Safe": 3
}

# Priority levels
PRIORITY_LEVELS = ["low", "medium", "high"]

# User roles
USER_ROLES = ["Admin", "Mentor", "Professor", "Student"]

# Worklet roles (in associations)
WORKLET_ROLES = ["Mentor", "Student", "Professor"]

def normalize_status_text(status_input: str | int | None) -> str:
    """
    Normalize status to canonical text representation
    
    Args:
        status_input: Status as ID (int) or text (str)
        
    Returns:
        Normalized status text (e.g., "Ongoing", not "On Going")
    """
    if isinstance(status_input, int):
        return WORKLET_STATUS_MAP.get(status_input, "Ongoing")
    elif isinstance(status_input, str):
        # Normalize legacy "On Going" to "Ongoing"
        if status_input == "On Going":
            return "Ongoing"
        return status_input
    return "Ongoing"

def get_status_id(status_text: str) -> int:
    """
    Convert status text to database ID
    Accepts both "Ongoing" and legacy "On Going"
    
    Args:
        status_text: Status as text
        
    Returns:
        Status ID for database
    """
    return WORKLET_STATUS_REVERSE_MAP.get(status_text, DEFAULT_WORKLET_STATUS_ID)

def normalize_performance(performance_input: str | int | None) -> str | None:
    """
    Normalize performance to display text
    
    Args:
        performance_input: Performance as ID (int) or text (str)
        
    Returns:
        Performance text if string is present, return it directly
        If number is present, map it to string using PERFORMANCE_MAP
    """
    if performance_input is None:
        return None
    
    # Try to parse as int first (handles both int and numeric strings)
    try:
        num_perf = int(performance_input)
        return PERFORMANCE_MAP.get(num_perf, None)
    except (ValueError, TypeError):
        # If it's a non-numeric string, return it directly
        if isinstance(performance_input, str):
            return performance_input
        return None

def normalize_risk_status(risk_input: str | int | None) -> str | None:
    """
    Normalize risk status to display text
    
    Args:
        risk_input: Risk status as ID (int) or text (str)
        
    Returns:
        Risk status text (NA, High, Medium, Safe)
    """
    if risk_input is None:
        return None
    
    # Try to parse as int first (handles both int and numeric strings)
    try:
        num_risk = int(risk_input)
        return RISK_STATUS_MAP.get(num_risk, None)
    except (ValueError, TypeError):
        # If it's a non-numeric string, return it directly
        if isinstance(risk_input, str):
            return risk_input
        return None
