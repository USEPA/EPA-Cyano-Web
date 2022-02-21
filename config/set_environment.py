"""
Sets environment from .env files.
"""

import os
import sys
import logging
from dotenv import load_dotenv
import platform
import requests
import json
import socket

# logger = logging.getLogger(__name__)
# logger.warning("EPA-Cyano-Web set_environment.py")

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))


class DeployEnv:
    """
    Class for determining deploy env for running QED apps.
    """

    def __init__(self):
        self.env_path = os.path.join(PROJECT_ROOT, ".env")

    def load_deployment_environment(self):
        # TODO: Load default .env if .env not found?
        logging.warning("Loading env vars from: {}.".format(self.env_path))
        load_dotenv(self.env_path)  # loads env vars into environment