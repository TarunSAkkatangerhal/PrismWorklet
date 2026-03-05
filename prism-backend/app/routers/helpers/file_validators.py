"""
File Validation Utilities
Secure file upload validation with MIME type and extension checking
"""
from pathlib import Path
from fastapi import HTTPException, UploadFile
from typing import Set, Dict


# Allowed MIME types mapped to their extensions
ALLOWED_FILE_TYPES = {
    'application/pdf': ['.pdf'],
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'text/plain': ['.txt']
}

# Flatten to get all allowed extensions
ALLOWED_EXTENSIONS = {ext for exts in ALLOWED_FILE_TYPES.values() for ext in exts}

# Maximum file size in bytes (from settings, default 10MB)
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

# File signatures (magic bytes) for validation
FILE_SIGNATURES: Dict[str, list] = {
    'application/pdf': [b'%PDF'],
    'image/png': [b'\x89PNG\r\n\x1a\n'],
    'image/jpeg': [b'\xff\xd8\xff'],
    'text/plain': []  # Text files don't have a consistent signature
}


def validate_file_extension(filename: str) -> str:
    """
    Validate file extension against allowed types.
    
    Args:
        filename: Name of the file
        
    Returns:
        File extension (lowercase with dot)
        
    Raises:
        HTTPException: 400 if extension not allowed
    """
    file_extension = Path(filename).suffix.lower()
    
    if not file_extension or file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    return file_extension


def validate_file_mime_type(file: UploadFile, declared_content_type: str) -> None:
    """
    Validate file MIME type by reading file magic bytes.
    
    Args:
        file: UploadFile object
        declared_content_type: Content type declared by client
        
    Raises:
        HTTPException: 400 if MIME type doesn't match or is not allowed
    """
    # Check declared content type first
    if declared_content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{declared_content_type}' not allowed"
        )
    
    # Read first 16 bytes to detect actual MIME type
    file.file.seek(0)
    header = file.file.read(16)
    file.file.seek(0)
    
    if not header:
        raise HTTPException(
            status_code=400,
            detail="File is empty or corrupted"
        )
    
    # Validate file signature matches declared type
    signatures = FILE_SIGNATURES.get(declared_content_type, [])
    
    # For files with signatures, validate them
    if signatures:
        signature_match = False
        for signature in signatures:
            if header.startswith(signature):
                signature_match = True
                break
        
        if not signature_match:
            raise HTTPException(
                status_code=400,
                detail="File content does not match declared type"
            )
    # For text files, do basic validation
    elif declared_content_type == 'text/plain':
        try:
            # Try to decode as text
            header.decode('utf-8')
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="File does not appear to be valid text"
            )


def validate_file_size(file: UploadFile, max_size_bytes: int = MAX_FILE_SIZE_BYTES) -> int:
    """
    Validate file size is within allowed limits.
    
    Args:
        file: UploadFile object
        max_size_bytes: Maximum allowed size in bytes
        
    Returns:
        File size in bytes
        
    Raises:
        HTTPException: 400 if file exceeds size limit
    """
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > max_size_bytes:
        max_size_mb = max_size_bytes / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {max_size_mb:.1f}MB"
        )
    
    if file_size == 0:
        raise HTTPException(
            status_code=400,
            detail="File is empty"
        )
    
    return file_size


def validate_path_security(file_path: Path, base_directory: Path) -> None:
    """
    Validate that a file path is within the allowed base directory.
    Prevents path traversal attacks.
    
    Args:
        file_path: Path to validate
        base_directory: Base directory that should contain the file
        
    Raises:
        HTTPException: 403 if path traversal detected
    """
    try:
        # Resolve both paths to absolute paths
        resolved_file = file_path.resolve()
        resolved_base = base_directory.resolve()
        
        # Check if file is within base directory
        resolved_file.relative_to(resolved_base)
    except (ValueError, RuntimeError):
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )


async def validate_uploaded_file(
    file: UploadFile,
    max_size_bytes: int = MAX_FILE_SIZE_BYTES
) -> tuple:
    """
    Comprehensive validation of uploaded file.
    
    Args:
        file: UploadFile to validate
        max_size_bytes: Maximum allowed size
        
    Returns:
        Tuple of (file_extension, file_size)
        
    Raises:
        HTTPException: 400 if validation fails
    """
    # Validate extension
    file_extension = validate_file_extension(file.filename)
    
    # Validate MIME type
    validate_file_mime_type(file, file.content_type)
    
    # Validate size
    file_size = validate_file_size(file, max_size_bytes)
    
    # CRITICAL: Reset file pointer to beginning for subsequent operations
    file.file.seek(0)
    
    return file_extension, file_size
