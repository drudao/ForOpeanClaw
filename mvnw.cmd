@REM ----------------------------------------------------------------------------
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
@REM ----------------------------------------------------------------------------
@REM Maven Wrapper startup batch script, version 3.3.2
@REM ----------------------------------------------------------------------------

@echo off
set WRAPPER_JAR="%cd%\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_PROPERTIES="%cd%\.mvn\wrapper\maven-wrapper.properties"

if not exist %WRAPPER_JAR% (
    echo Maven Wrapper JAR not found at: %WRAPPER_JAR%
    exit /b 1
)

if not exist %WRAPPER_PROPERTIES% (
    echo Maven Wrapper properties not found at: %WRAPPER_PROPERTIES%
    exit /b 1
)

@REM Determine JAVA_HOME
if "%JAVA_HOME%" == "" (
    for /f "usebackq tokens=*" %%i in (`where java 2^>nul`) do (
        set "JAVA_CMD=%%i"
    )
    if not defined JAVA_CMD (
        echo JAVA_HOME is not set and no java command found in PATH
        exit /b 1
    )
) else (
    set "JAVA_CMD=%JAVA_HOME%\bin\java.exe"
)

@REM Run Maven Wrapper
set MAVEN_JAVA_EXE=%JAVA_CMD%
"%MAVEN_JAVA_EXE%" %MAVEN_OPTS% -jar %WRAPPER_JAR% %*
if ERRORLEVEL 1 exit /b 1
