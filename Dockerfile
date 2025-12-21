# Use the official .NET SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["iknow-api/iknow-api.csproj", "iknow-api/"]
RUN dotnet restore "iknow-api/iknow-api.csproj"

# Copy the rest of the files and build
COPY . .
WORKDIR "/src/iknow-api"
RUN dotnet build "iknow-api.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "iknow-api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use the runtime image for the final stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=publish /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "iknow-api.dll"]
