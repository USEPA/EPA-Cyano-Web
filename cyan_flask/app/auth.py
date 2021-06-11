import os
from os.path import basename
import datetime
import time
import hashlib
import binascii
import jwt
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import COMMASPACE, formatdate
import logging
import secrets
import zlib
from base64 import urlsafe_b64encode as b64e, urlsafe_b64decode as b64d

from cyan_flask.crypt import CryptManager
from csv_handler import CSVHandler

crypt_manager = CryptManager()
csv_handler = CSVHandler()


class PasswordHandler:
    def __init__(self):
        pass

    def _create_reset_email_message(self, server_email, user_email):
        subject = "Password reset for Cyano Web"
        user_link = self._create_reset_link(user_email)
        msg = "\r\n".join(
            [
                "From: {}".format(server_email),
                "To: {}".format(user_email),
                "Subject: {}".format(subject),
                "",
                "Follow link to reset password: {}".format(user_link),
            ]
        )
        return msg

    def _create_job_email_message(self, server_email, user_email, file=None):
        subject = "Cyano job complete"
        text = "Cyano job is complete"  # TODO: Add more info in body
        msg = MIMEMultipart()
        msg["From"] = server_email
        msg["To"] = user_email
        msg["Date"] = formatdate(localtime=True)
        msg["Subject"] = subject

        msg.attach(MIMEText(text))

        if file:
            with open(file, "r") as file_obj:
                part = MIMEApplication(file_obj.read(), Name=basename(file))
                part["Content-Disposition"] = "attachment; filename={}".format(
                    basename(file)
                )
                msg.attach(part)

        return msg.as_string()

    def _create_reset_link(self, user_email):
        jwt_token = JwtHandler().encode_auth_token(
            user_email
        )  # NOTE: using email for 'sub' in token
        return (
            os.getenv("HOST_DOMAIN", "http://localhost:4200")
            + "/reset?token="
            + jwt_token.decode("utf-8")
        )

    def _create_csv_link(self, username):
        jwt_token = JwtHandler().encode_auth_token(
            username
        )  # NOTE: username for 'sub' in token
        return (
            os.getenv("HOST_DOMAIN", "http://localhost:4200")
            + os.getenv("API_URL", "/cyan/app/api/")
            + "csv?token="
            + jwt_token.decode("utf-8")
        )

    def _send_mail(self, smtp_email, smtp_pass, user_email, msg):
        try:
            server = smtplib.SMTP_SSL(os.getenv('EMAIL_SMTP'), os.getenv('EMAIL_PORT'))
            server.ehlo()
            server.login(smtp_email, smtp_pass)
            server.sendmail(smtp_email, user_email, msg)
            server.close()
            return {"success": "Email sent."}
        except Exception as e:
            logging.warning("Error sending reset email: {}".format(e))
            return {"error": "Unable to send email."}

    def _handle_config_password(self, smtp_pass):
        # return self.config_obj.unobscure(smtp_pass.encode()).decode()
        return crypt_manager.decrypt_message(crypt_manager.get_key(), smtp_pass)

    def hash_password(self, password):
        salt = hashlib.sha256(os.urandom(60)).hexdigest().encode("ascii")
        password_hash = hashlib.pbkdf2_hmac(
            "sha512", password.encode("utf-8"), salt, 100000
        )
        password_hex = binascii.hexlify(password_hash)
        password_salted = (salt + password_hex).decode("ascii")
        return password_salted

    def test_password(self, password_0, password_1):
        salt = password_0[:64]
        password_1_hash = hashlib.pbkdf2_hmac(
            "sha512", password_1.encode("utf-8"), salt.encode("ascii"), 100000
        )
        password_1_hex = binascii.hexlify(password_1_hash).decode("ascii")
        return password_0[64:] == password_1_hex

    def send_password_reset_email(self, request):
        """
        Handled contacts page comment submission by sending email
        to cts email using an smtp server.
        """
        smtp_pass = self._handle_config_password(os.getenv("EMAIL_PASS"))
        smtp_email = os.getenv("EMAIL")
        user_email = request.get("user_email")
        msg = self._create_reset_email_message(smtp_email, user_email)
        return self._send_mail(smtp_email, smtp_pass, user_email, msg)

    def send_batch_job_complete_email(self, request):
        """
        Sends email to user that batch job is complete.
        Includes info about job and link to download CSV.
        """
        smtp_pass = self._handle_config_password(os.getenv("EMAIL_PASS"))
        smtp_email = os.getenv("EMAIL")
        user_email = request.get("user_email")
        input_filename = request.get("filename")
        output_filename = csv_handler.generate_output_filename(input_filename)
        file_path = csv_handler.build_csv_file_path(output_filename)
        msg = self._create_job_email_message(smtp_email, user_email, file_path)
        return self._send_mail(smtp_email, smtp_pass, user_email, msg)


class JwtHandler:
    def __init__(self):
        pass

    def encode_auth_token(self, user):
        """
        Generates the Auth Token.
        """
        try:
            payload = {
                "exp": datetime.datetime.utcnow()
                + datetime.timedelta(
                    seconds=int(os.getenv("SESSION_EXPIRE_SECONDS", 300))
                ),
                "iat": datetime.datetime.utcnow(),
                "sub": user,
            }
            enc_token = jwt.encode(
                payload, os.getenv("SECRET_KEY"), algorithm="HS256"
            )
            return crypt_manager.convert_to_bytes(enc_token)
        except Exception as e:
            return e

    def decode_auth_token(self, auth_token):
        """
        Decodes the auth token.
        """
        try:
            return jwt.decode(
                auth_token, os.getenv("SECRET_KEY"), algorithms=["HS256"]
            )
        except jwt.ExpiredSignatureError:
            return {"error": "Signature expired. Please log in again."}
        except jwt.InvalidTokenError:
            return {"error": "Invalid token. Please log in again."}
        except jwt.exceptions.DecodeError as identifier:
            return {"error": "invalid authorization token"}

    def check_time_delta(self, token_expiry):
        """
        Calculates seconds between current time and
        token's expiration time. > 0 indicates number of seconds
        until expiration, < 0 indicates an expired token.
        """
        return token_expiry - time.time()

    def get_user_from_token(self, request):
        """
        Gets user/owner name from token.
        """
        token = request.headers.get("Authorization", None)
        if token:
            print(token)
            print(self.decode_auth_token(token.split(" ")[1]))
            return self.decode_auth_token(token.split(" ")[1])["sub"]
        return None

    def get_user_token(self, request):
        """
        Gets user's token.
        """
        token = request.headers.get("Authorization", None)
        if token:
            return self.decode_auth_token(token.split(" ")[1])
        return None
