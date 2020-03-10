echo off
::set /P CYANO_CONFIG=Enter config file to use:
::set CYANO_CONFIG=../config/%CYANO_CONFIG%
:: Input argument is env filename:
set CYANO_CONFIG=%1

echo ***** Setting enviroment variables from %CYANO_CONFIG% *****

if exist %CYANO_CONFIG% (
	::for /F "tokens=*" %%A in (%CYANO_CONFIG%) do set %%A&& echo %%A
	for /F "tokens=*" %%A in (%CYANO_CONFIG%) do set %%A&& echo %%A
)