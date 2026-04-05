.PHONY: backend-restore backend-build backend-test

BACKEND_SOLUTION := backend/graduate-system-worker.sln

backend-restore:
	DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 dotnet restore $(BACKEND_SOLUTION) --disable-build-servers -m:1

backend-build:
	DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 dotnet build $(BACKEND_SOLUTION) --disable-build-servers -m:1

backend-test:
	DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 dotnet test $(BACKEND_SOLUTION) --disable-build-servers -m:1
