class AppException(Exception):
    """Base exception for application errors."""
    pass

class DatabaseError(AppException):
    """Raised when a database error occurs."""
    pass

class EmotionClassificationError(AppException):
    """Raised when emotion classification fails."""
    pass

class NotFoundError(AppException):
    """Raised when a requested resource is not found."""
    pass
