"""
Data encryption service for sensitive data protection
"""

from cryptography.fernet import Fernet
import base64
import os
from typing import Optional
from loguru import logger

class DataEncryption:
    """Handles encryption/decryption of sensitive data"""

    def __init__(self, key: Optional[str] = None, salt: Optional[bytes] = None):
        """
        Initialize encryption service

        Args:
            key: Base64 encoded encryption key (32 bytes)
            salt: Salt for key derivation (16 bytes)
        """
        self.salt = salt or os.getenv('ENCRYPTION_SALT', os.urandom(16))

        if key:
            self.key = base64.urlsafe_b64decode(key)
        else:
            # Try to get from environment or generate new key
            env_key = os.getenv('ENCRYPTION_KEY')
            if env_key:
                self.key = base64.urlsafe_b64decode(env_key)
            else:
                logger.warning("No encryption key provided, generating temporary key")
                self.key = Fernet.generate_key()

        self.cipher = Fernet(self.key)

    @classmethod
    def generate_key(cls) -> str:
        """Generate a new encryption key"""
        key = Fernet.generate_key()
        return base64.urlsafe_b64encode(key).decode()

    def encrypt_data(self, data: str) -> str:
        """Encrypt string data"""
        try:
            if not data:
                return data
            encrypted = self.cipher.encrypt(data.encode('utf-8'))
            return base64.urlsafe_b64encode(encrypted).decode('utf-8')
        except Exception as e:
            logger.error(f"Encryption error: {e}")
            raise

    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt string data"""
        try:
            if not encrypted_data:
                return encrypted_data
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode('utf-8'))
            decrypted = self.cipher.decrypt(encrypted_bytes)
            return decrypted.decode('utf-8')
        except Exception as e:
            logger.error(f"Decryption error: {e}")
            raise

    def encrypt_embeddings(self, embeddings: list) -> str:
        """Encrypt vector embeddings"""
        try:
            # Convert list to string representation
            embedding_str = ','.join(map(str, embeddings))
            return self.encrypt_data(embedding_str)
        except Exception as e:
            logger.error(f"Embedding encryption error: {e}")
            raise

    def decrypt_embeddings(self, encrypted_embeddings: str) -> list:
        """Decrypt vector embeddings"""
        try:
            embedding_str = self.decrypt_data(encrypted_embeddings)
            return [float(x) for x in embedding_str.split(',')]
        except Exception as e:
            logger.error(f"Embedding decryption error: {e}")
            raise

    def rotate_key(self, new_key: str) -> None:
        """Rotate encryption key"""
        try:
            self.key = base64.urlsafe_b64decode(new_key)
            self.cipher = Fernet(self.key)
            logger.info("Encryption key rotated successfully")
        except Exception as e:
            logger.error(f"Key rotation error: {e}")
            raise

    def get_key_info(self) -> dict:
        """Get information about current encryption key"""
        return {
            "key_length": len(self.key),
            "salt_length": len(self.salt),
            "algorithm": "Fernet (AES 128 CBC + HMAC)"
        }

class SecureField:
    """Descriptor for automatically encrypting/decrypting model fields"""

    def __init__(self, field_name: str):
        self.field_name = field_name
        self.encryption_service = DataEncryption()

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        encrypted_value = getattr(obj, f"_{self.field_name}", None)
        if encrypted_value:
            return self.encryption_service.decrypt_data(encrypted_value)
        return None

    def __set__(self, obj, value):
        if value is not None:
            encrypted_value = self.encryption_service.encrypt_data(str(value))
            setattr(obj, f"_{self.field_name}", encrypted_value)
        else:
            setattr(obj, f"_{self.field_name}", None)

# Global encryption service instance
encryption_service = DataEncryption()

def encrypt_sensitive_data(data: str) -> str:
    """Convenience function for encrypting sensitive data"""
    return encryption_service.encrypt_data(data)

def decrypt_sensitive_data(encrypted_data: str) -> str:
    """Convenience function for decrypting sensitive data"""
    return encryption_service.decrypt_data(encrypted_data)

def encrypt_vector_embeddings(embeddings: list) -> str:
    """Convenience function for encrypting vector embeddings"""
    return encryption_service.encrypt_embeddings(embeddings)

def decrypt_vector_embeddings(encrypted_embeddings: str) -> list:
    """Convenience function for decrypting vector embeddings"""
    return encryption_service.decrypt_embeddings(encrypted_embeddings)
