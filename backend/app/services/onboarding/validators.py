"""
Onboarding Field Validation Utilities

Centralized, consistent validators for all onboarding services.
MANDATORY: Use these validators in all services to ensure consistency.
"""

import re
from datetime import datetime, date
from typing import Optional, List, Dict, Any
import structlog

logger = structlog.get_logger(__name__)

# ============================================================================
# STANDARD FIELD VALIDATORS
# ============================================================================

class FieldValidators:
    """Centralized validators for common onboarding fields."""
    
    # Name validation
    @staticmethod
    def validate_name(name: Optional[str], field_name: str = "Name", min_length: int = 1, max_length: int = 100) -> Optional[str]:
        """Validate name field (both first/last and full names)."""
        if not name or not isinstance(name, str):
            return f"{field_name} is required"
        
        name = name.strip()
        if len(name) < min_length:
            return f"{field_name} must be at least {min_length} character(s)"
        if len(name) > max_length:
            return f"{field_name} must be at most {max_length} characters"
        
        # Check for valid characters (letters, spaces, hyphens, apostrophes)
        if not re.match(r"^[a-zA-Z\s\-']+$", name):
            return f"{field_name} contains invalid characters"
        
        return None

    # Phone validation (International format)
    @staticmethod
    def validate_phone(phone: Optional[str], field_name: str = "Phone") -> Optional[str]:
        """Validate international phone number format."""
        if not phone or not isinstance(phone, str):
            return f"{field_name} is required"
        
        phone = phone.strip()
        # International phone: + followed by 5-15 digits, can have spaces, hyphens
        if not re.match(r"^\+?[1-9]\d{1,14}$", phone.replace(" ", "").replace("-", "")):
            return f"{field_name} must be a valid international phone number (e.g., +1-234-567-8900)"
        
        return None

    # Email validation
    @staticmethod
    def validate_email(email: Optional[str], field_name: str = "Email", required: bool = True) -> Optional[str]:
        """Validate email format."""
        if not email:
            return f"{field_name} is required" if required else None
        
        if not isinstance(email, str):
            return f"{field_name} must be a string"
        
        email = email.strip().lower()
        # RFC 5322 simplified
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email):
            return f"{field_name} must be a valid email address"
        
        return None

    # Date of birth validation
    @staticmethod
    def validate_dob(dob_str: Optional[str], field_name: str = "Date of birth", min_age: int = 5, max_age: int = 120) -> Optional[str]:
        """Validate date of birth."""
        if not dob_str:
            return f"{field_name} is required"
        
        try:
            # Accept ISO format (YYYY-MM-DD)
            if isinstance(dob_str, str):
                dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
            else:
                dob = dob_str
            
            today = date.today()
            age = (today - dob).days // 365
            
            if age < min_age:
                return f"You must be at least {min_age} years old"
            if age > max_age:
                return f"Invalid date of birth"
            
            return None
        except (ValueError, AttributeError):
            return f"{field_name} must be in YYYY-MM-DD format"

    # Roll number validation (campus identifier)
    @staticmethod
    def validate_roll_number(roll: Optional[str], pattern: str = r"^\d{2}NU\dA\d{4}$", field_name: str = "Roll number") -> Optional[str]:
        """Validate roll number against institution pattern."""
        if not roll or not isinstance(roll, str):
            return f"{field_name} is required"
        
        roll = roll.strip().upper()
        if not re.match(pattern, roll):
            return f"{field_name} format is invalid (expected: 22NU1A2001)"
        
        return None

    # Employee ID validation
    @staticmethod
    def validate_employee_id(emp_id: Optional[str], prefix: str = "FAC", field_name: str = "Employee ID") -> Optional[str]:
        """Validate employee ID format."""
        if not emp_id or not isinstance(emp_id, str):
            return f"{field_name} is required"
        
        emp_id = emp_id.strip().upper()
        pattern = f"^{prefix}\\d{{3}}$"
        
        if not re.match(pattern, emp_id):
            return f"{field_name} must be in format {prefix}001"
        
        return None

    # License number validation
    @staticmethod
    def validate_license_number(license_num: Optional[str], field_name: str = "License number") -> Optional[str]:
        """Validate professional license number (flexible alphanumeric)."""
        if not license_num or not isinstance(license_num, str):
            return f"{field_name} is required"
        
        license_num = license_num.strip().upper()
        
        # Allow letters and numbers, 4-20 characters
        if not re.match(r"^[A-Z0-9]{4,20}$", license_num):
            return f"{field_name} must be 4-20 alphanumeric characters"
        
        return None

    # URL validation
    @staticmethod
    def validate_url(url: Optional[str], field_name: str = "URL", required: bool = False) -> Optional[str]:
        """Validate URL format."""
        if not url:
            return f"{field_name} is required" if required else None
        
        if not isinstance(url, str):
            return f"{field_name} must be a string"
        
        url = url.strip()
        # Simple URL validation
        if not re.match(r"^https?://[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+$", url):
            return f"{field_name} must be a valid URL starting with http:// or https://"
        
        return None

    # Textarea validation
    @staticmethod
    def validate_textarea(text: Optional[str], field_name: str = "Text", min_len: int = 0, max_len: int = 5000, required: bool = False) -> Optional[str]:
        """Validate textarea input."""
        if not text:
            return f"{field_name} is required" if required else None
        
        if not isinstance(text, str):
            return f"{field_name} must be a string"
        
        text = text.strip()
        
        if len(text) < min_len:
            return f"{field_name} must be at least {min_len} characters"
        if len(text) > max_len:
            return f"{field_name} must be at most {max_len} characters"
        
        return None

    # Mastery score validation (0.0-1.0)
    @staticmethod
    def validate_mastery_score(score: Any, min_threshold: float = 0.0, field_name: str = "Mastery score") -> Optional[str]:
        """Validate mastery score between 0.0 and 1.0."""
        try:
            score_float = float(score)
            if score_float < 0.0 or score_float > 1.0:
                return f"{field_name} must be between 0.0 and 1.0"
            if score_float < min_threshold:
                return f"{field_name} must be at least {min_threshold*100:.0f}%"
            return None
        except (ValueError, TypeError):
            return f"{field_name} must be a decimal number"

    # Hourly rate validation
    @staticmethod
    def validate_hourly_rate(rate: Any, min_rate: float = 1.0, max_rate: float = 10000.0, field_name: str = "Hourly rate") -> Optional[str]:
        """Validate hourly rate in decimal format."""
        try:
            rate_float = float(rate)
            if rate_float < min_rate or rate_float > max_rate:
                return f"{field_name} must be between {min_rate} and {max_rate}"
            return None
        except (ValueError, TypeError):
            return f"{field_name} must be a valid decimal number"

    # List length validation
    @staticmethod
    def validate_list_length(items: Any, field_name: str = "Items", min_items: int = 1, max_items: int = 10) -> Optional[str]:
        """Validate list has correct number of items."""
        if not items:
            return f"At least {min_items} {field_name} must be selected"
        
        if not isinstance(items, (list, tuple)):
            return f"{field_name} must be a list"
        
        if len(items) < min_items:
            return f"At least {min_items} {field_name} must be selected"
        if len(items) > max_items:
            return f"Maximum {max_items} {field_name} can be selected"
        
        return None

    # Dropdown value validation
    @staticmethod
    def validate_dropdown(value: Optional[str], allowed_values: List[str], field_name: str = "Selection") -> Optional[str]:
        """Validate dropdown selection is in allowed values."""
        if not value:
            return f"{field_name} must be selected"
        
        if value not in allowed_values:
            return f"Invalid {field_name} selection"
        
        return None

    # Time range validation
    @staticmethod
    def validate_time_range(start_time: str, end_time: str, field_name: str = "Time range") -> Optional[str]:
        """Validate time range (HH:MM format)."""
        try:
            start = datetime.strptime(start_time, "%H:%M").time()
            end = datetime.strptime(end_time, "%H:%M").time()
            
            if end <= start:
                return f"{field_name}: End time must be after start time"
            
            return None
        except (ValueError, AttributeError):
            return f"{field_name} must be in HH:MM format"

    # Year validation
    @staticmethod
    def validate_year(year: Any, min_year: int = 2000, max_year: int = None, field_name: str = "Year") -> Optional[str]:
        """Validate year is in valid range."""
        try:
            year_int = int(year)
            if max_year is None:
                max_year = datetime.now().year + 10
            
            if year_int < min_year or year_int > max_year:
                return f"{field_name} must be between {min_year} and {max_year}"
            
            return None
        except (ValueError, TypeError):
            return f"{field_name} must be a valid year"


# ============================================================================
# BATCH VALIDATORS
# ============================================================================

class BatchValidators:
    """Validators for multi-field validation scenarios."""
    
    @staticmethod
    def validate_personal_info(data: Dict[str, Any]) -> List[str]:
        """Validate common personal information fields."""
        errors = []
        
        if error := FieldValidators.validate_name(data.get("first_name"), "First name"):
            errors.append(error)
        if error := FieldValidators.validate_name(data.get("last_name"), "Last name"):
            errors.append(error)
        if error := FieldValidators.validate_email(data.get("email"), "Email", required=False):
            errors.append(error)
        if phone := data.get("phone"):
            if error := FieldValidators.validate_phone(phone, "Phone"):
                errors.append(error)
        
        return errors

    @staticmethod
    def validate_contact_info(data: Dict[str, Any]) -> List[str]:
        """Validate contact fields (phone/email)."""
        errors = []
        
        has_phone = data.get("phone")
        has_email = data.get("email")
        
        if not has_phone and not has_email:
            errors.append("At least one contact method (phone or email) is required")
        
        if has_phone:
            if error := FieldValidators.validate_phone(has_phone, "Phone"):
                errors.append(error)
        
        if has_email:
            if error := FieldValidators.validate_email(has_email, "Email"):
                errors.append(error)
        
        return errors

    @staticmethod
    def validate_time_availability(days: List[str], time_slots: Dict[str, list], field_name: str = "Availability") -> List[str]:
        """Validate availability schedule."""
        errors = []
        valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        if not days:
            errors.append(f"{field_name}: At least one day must be selected")
        else:
            for day in days:
                if day not in valid_days:
                    errors.append(f"{field_name}: Invalid day '{day}'")
        
        if not time_slots:
            errors.append(f"{field_name}: At least one time slot must be specified")
        
        return errors


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def sanitize_name(name: str) -> str:
    """Sanitize name for storage (normalize whitespace, case)."""
    if not name:
        return ""
    return " ".join(name.split()).title()

def normalize_phone(phone: str) -> str:
    """Normalize phone number to standard format."""
    if not phone:
        return ""
    # Remove all non-digit characters except leading +
    normalized = re.sub(r'[^\d+]', '', phone)
    return normalized

def normalize_email(email: str) -> str:
    """Normalize email to lowercase."""
    if not email:
        return ""
    return email.strip().lower()
