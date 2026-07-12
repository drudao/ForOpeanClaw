@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ---------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script, version 3.3.2
@REM
@REM Required ENV vars:
@REM JAVA_HOME - location of a JDK home dir
@REM
@REM Optional ENV vars
@REM MAVEN_BATCH_ECHO - set to 'on' to enable the echoing of the batch commands
@REM MAVEN_BATCH_PAUSE - set to 'on' to wait for a keystroke before ending
@REM MAVEN_OPTS - parameters passed to the Java VM when running Maven
@REM     e.g. to debug Maven itself, use
@REM set MAVEN_OPTS=-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=8000
@REM MAVEN_SKIP_RC - flag to disable loading of mavenrc files
@REM ---------------------------------------------------------------------------

@REM Begin all REM lines with '@' in case MAVEN_BATCH_ECHO is 'on'
@echo off
@REM set title of command window
title %0
@REM enable echoing by setting MAVEN_BATCH_ECHO to 'on'
@if "%MAVEN_BATCH_ECHO%" == "on"  echo %MAVEN_BATCH_ECHO%

@REM set %HOME% to equivalent of $HOME
if "%HOME%" == "" (set "HOME=%HOMEDRIVE%%HOMEPATH%")

@REM Execute a user defined script before this one
if not "%MAVEN_SKIP_RC%" == "" goto skipRcPre
@REM check for pre script, once with legacy .bat ending and once with .cmd ending
if exist "%USERPROFILE%\mavenrc_pre.bat" call "%USERPROFILE%\mavenrc_pre.bat"  %*
if exist "%USERPROFILE%\mavenrc_pre.cmd" call "%USERPROFILE%\mavenrc_pre.cmd"  %*
:skipRcPre

@setlocal

set MAVEN_JAR_EXE=%MAVEN_HOME%/maven-wrapper.jar
if exist "%MAVEN_JAR_EXE%" goto init

echo.
echo Error: could not find %MAVEN_JAR_EXE% >&2
echo Downloading from Maven Central... >&2
if /i "%CMD_ECHO%"=="on" echo %CMDLINE%
@REM try to download wrapper from Maven Central
if exist "%HOME%\.m2\wrapper\dists\*" goto init
"%JAVA_EXE%" %MAVEN_OPTS% -jar "%MAVEN_JAR_EXE%" --download 2>&1
if ERRORLEVEL 1 goto error
goto init

:init
@REM Find project base
@REM set MAVEN_PROJECTBASEDIR
%MAVEN_JAR_EXE% --project-basedir "%cd%"
if ERRORLEVEL 1 goto error
goto end

:error
set MAVEN_PROJECTBASEDIR=
echo Error: Maven wrapper download failed
exit /b 1

:end
@endlocal & set MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR%
