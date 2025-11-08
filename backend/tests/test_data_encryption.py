"""
Tests for data encryption service
"""

import pytest
from unittest.mock import patch, Mock
from services.data_encryption import (
    DataEncryption, SecureField, encryption_service,
    encrypt_sensitive_data, decrypt_sensitive_data,
    encrypt_vector_embeddings, decrypt_vector_embeddings
)


class TestDataEncryption:
    """Test cases for DataEncryption service"""

    def test_encryption_initialization(self):
        """Test encryption service initialization"""
        encryption = DataEncryption()
        assert encryption.cipher is not None
        assert encryption.key is not None

    def test_encryption_with_custom_key(self):
        """Test encryption with custom key"""
        key = DataEncryption.generate_key()
        encryption = DataEncryption(key)
        assert encryption.key is not None

    def test_generate_key(self):
        """Test key generation"""
        key = DataEncryption.generate_key()
        assert isinstance(key, str)
        assert len(key) > 0

    def test_encrypt_decrypt_data(self):
        """Test basic encrypt/decrypt functionality"""
        encryption = DataEncryption()
        test_data = "sensitive information"

        encrypted = encryption.encrypt_data(test_data)
        decrypted = encryption.decrypt_data(encrypted)

        assert encrypted != test_data
        assert decrypted == test_data

    def test_encrypt_empty_data(self):
        """Test encryption of empty data"""
        encryption = DataEncryption()
        encrypted = encryption.encrypt_data("")
        decrypted = encryption.decrypt_data(encrypted)

        assert decrypted == ""

    def test_encrypt_none_data(self):
        """Test encryption of None data"""
        encryption = DataEncryption()
        encrypted = encryption.encrypt_data(None)
        decrypted = encryption.decrypt_data(encrypted)

        assert decrypted is None

    def test_decrypt_invalid_data(self):
        """Test decryption of invalid data"""
        encryption = DataEncryption()

        with pytest.raises(Exception):
            encryption.decrypt_data("invalid_encrypted_data")

    def test_encrypt_decrypt_embeddings(self):
        """Test embedding encryption/decryption"""
        encryption = DataEncryption()
        test_embeddings = [0.1, 0.2, 0.3, 0.4, 0.5]

        encrypted = encryption.encrypt_embeddings(test_embeddings)
        decrypted = encryption.decrypt_embeddings(encrypted)

        assert encrypted != str(test_embeddings)
        assert decrypted == test_embeddings

    def test_key_rotation(self):
        """Test encryption key rotation"""
        encryption = DataEncryption()
        old_key = encryption.key

        new_key = DataEncryption.generate_key()
        encryption.rotate_key(new_key)

        assert encryption.key != old_key

    def test_get_key_info(self):
        """Test getting key information"""
        encryption = DataEncryption()
        info = encryption.get_key_info()

        assert "key_length" in info
        assert "algorithm" in info
        assert info["algorithm"] == "Fernet (AES 128 CBC + HMAC)"


class TestSecureField:
    """Test cases for SecureField descriptor"""

    def test_secure_field_descriptor(self):
        """Test SecureField descriptor functionality"""
        class TestModel:
            sensitive_field = SecureField("sensitive_field")

            def __init__(self):
                self._sensitive_field = None

        model = TestModel()
        test_value = "secret data"

        # Test setting value
        model.sensitive_field = test_value

        # Test getting value
        retrieved_value = model.sensitive_field
        assert retrieved_value == test_value

    def test_secure_field_none_value(self):
        """Test SecureField with None values"""
        class TestModel:
            sensitive_field = SecureField("sensitive_field")

            def __init__(self):
                self._sensitive_field = None

        model = TestModel()
        model.sensitive_field = None

        assert model.sensitive_field is None


class TestGlobalEncryptionService:
    """Test the global encryption service instance"""

    def test_global_encryption_service(self):
        """Test global encryption service"""
        assert encryption_service is not None
        assert hasattr(encryption_service, 'encrypt_data')
        assert hasattr(encryption_service, 'decrypt_data')

    def test_convenience_functions(self):
        """Test convenience functions"""
        test_data = "test data"

        # Test encrypt/decrypt
        encrypted = encrypt_sensitive_data(test_data)
        decrypted = decrypt_sensitive_data(encrypted)
        assert decrypted == test_data

        # Test embedding functions
        embeddings = [0.1, 0.2, 0.3]
        encrypted_emb = encrypt_vector_embeddings(embeddings)
        decrypted_emb = decrypt_vector_embeddings(encrypted_emb)
        assert decrypted_emb == embeddings


class TestEncryptionErrorHandling:
    """Test error handling in encryption service"""

    @patch('services.data_encryption.Fernet')
    def test_encryption_failure(self, mock_fernet):
        """Test handling of encryption failures"""
        mock_cipher = Mock()
        mock_cipher.encrypt.side_effect = Exception("Encryption failed")
        mock_fernet.return_value = mock_cipher

        encryption = DataEncryption()

        with pytest.raises(Exception):
            encryption.encrypt_data("test")

    @patch('services.data_encryption.Fernet')
    def test_decryption_failure(self, mock_fernet):
        """Test handling of decryption failures"""
        mock_cipher = Mock()
        mock_cipher.decrypt.side_effect = Exception("Decryption failed")
        mock_fernet.return_value = mock_cipher

        encryption = DataEncryption()

        with pytest.raises(Exception):
            encryption.decrypt_data("test")
