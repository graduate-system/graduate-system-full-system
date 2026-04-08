# ── Stage 1: build & publish ─────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project file and restore (layer-cached separately from source)
COPY Api.csproj ./
RUN dotnet restore Api.csproj --disable-build-servers

# Copy source and publish
COPY . ./
RUN dotnet publish Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    --disable-build-servers

# ── Stage 2: runtime image ────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Create non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy published output
COPY --from=build /app/publish ./

# Runtime data directory (for committee PIN file)
RUN mkdir -p Api_Data && chown appuser:appgroup Api_Data

USER appuser

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "Api.dll"]
