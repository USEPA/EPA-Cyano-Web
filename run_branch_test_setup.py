"""
Runs setup procedure for testing a branch.
"""
import os
import sys
import subprocess
from pathlib import Path
import shutil
import uuid
import glob
import virtualenv
import runpy
from getpass import getpass

# Local imports:
from config.set_environment import DeployEnv
# from cyan_flask.build_db import DBHandler


# PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))


class BranchTests:

	def __init__(self, testing_directory, branch_name):
		self.branch_name = branch_name
		self.repo_path = "https://github.com/USEPA/EPA-Cyano-Web.git"  # github path
		self.testing_directory_path = Path(testing_directory)  # testing parent directory path
		self.testing_repo_name = "EPA-Cyano-Web-Testing"
		self.testing_repo = self.testing_directory_path / self.testing_repo_name  # local testing repo path
		self.cyan_flask_location = self.testing_repo / "cyan_flask"  # local testing flask path
		self.cyan_angular_location = self.testing_repo / "cyan_angular"  # local testing angular path

		# Python virtualenv paths:
		self.virtualenv_scripts_win = self.cyan_flask_location / "env" / "Scripts"  # cyan_flask virtual env's Script path (windows)
		self.virtualenv_python_win = self.virtualenv_scripts_win / "python"
		self.virtualenv_pip_win = self.virtualenv_scripts_win / "pip"
		self.python = str(self.virtualenv_python_win.resolve())  # virtual env's python executable (string for subprocess)
		self.pip = str(self.virtualenv_pip_win.resolve())  # virtual env's pip executable (string for subprocess)
		self.activate_script = str((self.virtualenv_scripts_win / "activate_this.py").resolve())  # activate virtual env (string for subprocess)

		# Angular paths:
		# self.angular_script = 

		# Test config settings:
		self.test_db_name = "test_cyan_web_app_db"  # local testing db name
		self.test_db_user = "test_user"
		self.test_flask_host = "localhost"
		self.test_flask_port = str(5050)
		self.test_angular_port = str(4242)
		self.test_angular_config = "local-testing"  # environment.local-testing.ts
		self.test_angular_host = "http://localhost:" + self.test_angular_port

		self.setup_env()  # sets up env from config

		self.root_pass = os.environ.get('MYSQL_ROOT_PASSWORD')
		self.user_pass = None

	def setup_env(self):
		runtime_env = DeployEnv()
		runtime_env.load_deployment_environment()
		
	def setup_repo(self):
		subprocess.run(
			["git", "clone", self.repo_path, "--branch", branch_name, self.testing_repo_name], 
			cwd=self.testing_directory_path
		)

	def setup_flask(self):
		subprocess.run(["virtualenv", "env"], cwd=self.cyan_flask_location)  # NOTE: Uses default Python on local machine
		subprocess.run([self.pip, "install", "-r", "requirements.txt"], cwd=self.cyan_flask_location)  # TODO: Should determine OS type
		self.activate_flask_env()

	def activate_flask_env(self):
		runpy.run_path(self.activate_script)  # activates virtual env

	def set_mysql_creds(self):
		"""
		Prompts user for credentials if not already set in environment.
		"""
		self.root_pass = self.root_pass or getpass(prompt="Please enter root password for database: ")
		self.test_db_user = self.test_db_user or input("Please enter user name for database (e.g., 'cyano' from config's local_dev.env): ")
		self.user_pass = os.environ.get('DB_PASS') or getpass("Please enter password for {}: ".format(self.test_db_user))

	def setup_mysql(self):
		from cyan_flask.build_db import DBHandler
		self.set_mysql_creds()
		db_handler = DBHandler(self.test_db_name, self.root_pass)
		db_handler.delete_user(self.test_db_user)  # deletes test user
		db_handler.delete_database()  # deletes test db
		status = db_handler.full_build(self.test_db_user, self.user_pass)
		if status != True:
			print("\nERROR: Building test database and tables failed.")
			return

	def setup_angular(self):
		npm = shutil.which("npm")  # get NPM in PATH
		subprocess.run([npm, "install"], cwd=self.cyan_angular_location)
		subprocess.run([npm, "audit", "fix"], cwd=self.cyan_angular_location)

	def start_flask(self):
		"""
		Starts Flask instance.
		"""
		self.activate_flask_env()  # NOTE: Assumes flask env has been setup (i.e., run_test_setup already established)
		old_env = dict(os.environ)
		current_env = dict(os.environ.copy())
		current_env.update({
			'DB_NAME': self.test_db_name,
			'DB_USER': self.test_db_user,
			'FLASK_PORT': self.test_flask_port,
			'FLASK_HOST': self.test_flask_host,
			'HOST_DOMAIN': self.test_angular_host
		})
		os.environ.update(current_env)
		subprocess.run([self.python, "__init__.py"], cwd=self.cyan_flask_location / "app")

	def start_angular(self):

		# Will Python os.environ changes be noticed in angular process???

		os.environ.update({
			'FLASK_PORT': self.test_flask_port,
			'FLASK_HOST': self.test_flask_host,
			'HOST_DOMAIN': self.test_angular_host
		})

		npx = shutil.which("npx")
		subprocess.run(
			[npx, "ng", "serve", "--port", self.test_angular_port, "--configuration", self.test_angular_config],
			cwd=self.cyan_angular_location
		)

	def run_test_setup(self):

		# Checks if repo already exists, prompt to manually delete:
		if self.testing_repo.exists():
			print("\nERROR: Cannot automatically remove test repo at {}. Manually remove and try again.".format(self.testing_repo.resolve()))
			return

		# Git clones feature branch:
		self.setup_repo()

		# Installs Python requirements for cyan_flask:
		self.setup_flask()

		# Builds test database and tables:
		print("Creating database {} with user {}".format(self.test_db_name, self.test_db_user))
		self.setup_mysql()

		# Installs NPM packages for cyan_angular:
		self.setup_angular()

		# Run tests for everything?

		# Removes test database, etc.??

		# Final. Remove test clone from current working repo.
		# shutil.rmtree(clone_repo_name)  # throws permission error (Windows 10)
		# self.remove_test_folder()



if __name__ == '__main__':

	args = """
	+++ Input Args +++
	1. option
	2. testing directory
	3. branch name
	"""

	options = """
	+++ Options +++
	1. setup - runs environment setup (run_test_setup() function).
	2. flask - starts up cyan flask (start_flask() function).
	3. angular - starts up cyan angular (start_angular() function).
	"""

	devs_settings = """
	+++ Host Software Locations +++
	Python: {}
	Pip: {}
	NPM: {}
	NPX: {}
	""".format(
		shutil.which("python"), 
		shutil.which("pip"),
		shutil.which("npm"),
		shutil.which("npx"))
	
	print("\n{}\n{}\n{}".format(args, options, devs_settings))

	if len(sys.argv) < 4:
		print("No enough args provided to run.\n{}".format(args))
	elif len(sys.argv) > 4:
		print("Too many args provided to run.\n{}".format(args))

	option, testing_directory, branch_name = None, None, None
	try:
		option = sys.argv[1]
		testing_directory = sys.argv[2]
		branch_name = sys.argv[3]
	except Exception as e:
		print("ERROR: {}".format(e))
		print("\n{}\n{}".format(options, args))
		raise

	branch_tests = BranchTests(testing_directory, branch_name)

	if option == 'setup':
		branch_tests.run_test_setup()
	elif option == 'flask':
		branch_tests.start_flask()
	elif option == 'angular':
		branch_tests.start_angular()
