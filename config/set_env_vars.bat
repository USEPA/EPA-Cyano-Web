echo off
::set /P QED_CONFIG=Enter config file to use:
::set QED_CONFIG=../config/%QED_CONFIG%
:: Input argument is env filename:
set QED_CONFIG=%1

echo ***** Setting enviroment variables from %QED_CONFIG% *****

if exist %QED_CONFIG% (
	::for /F "tokens=*" %%A in (%QED_CONFIG%) do set %%A&& echo %%A
	for /F "tokens=*" %%A in (%QED_CONFIG%) do set %%A&& echo %%A
)