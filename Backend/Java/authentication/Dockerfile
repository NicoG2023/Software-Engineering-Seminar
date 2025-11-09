# ==========================================================
# 🏗️  Etapa 1: Construcción (Builder)
# ==========================================================
FROM eclipse-temurin:21-jdk AS build

# Carpeta de trabajo dentro del contenedor
WORKDIR /workspace

# ----------------------------------------------------------
# 📦 Copiamos los archivos mínimos para aprovechar la caché
# ----------------------------------------------------------
COPY gradlew ./
# Instalamos dos2unix para corregir el formato CRLF de Windows
# y aseguramos permisos de ejecución
RUN apt-get update && apt-get install -y dos2unix && \
    dos2unix gradlew && chmod +x gradlew

# Copiamos el wrapper de Gradle y archivos de configuración
COPY gradle ./gradle
COPY build.gradle settings.gradle gradle.properties ./
# Si usas versión catalog:
# COPY gradle/libs.versions.toml gradle/libs.versions.toml

# ----------------------------------------------------------
# 🧰 Descargamos dependencias sin compilar (usa cache)
# ----------------------------------------------------------
RUN ./gradlew --no-daemon dependencies || true

# ----------------------------------------------------------
# 📁 Copiamos el código fuente de la app
# ----------------------------------------------------------
COPY src ./src

# ----------------------------------------------------------
# 🧱 Compilamos el proyecto en modo fast-jar (más liviano)
# ----------------------------------------------------------
RUN ./gradlew --no-daemon clean build -Dquarkus.package.type=fast-jar

# ==========================================================
# 🚀 Etapa 2: Ejecución (Runner)
# ==========================================================
FROM eclipse-temurin:21-jre AS runner

# Carpeta de trabajo final
WORKDIR /app

# Copiamos el resultado de la compilación
COPY --from=build /workspace/build/quarkus-app/ /app/

# Configuración de red
ENV QUARKUS_HTTP_HOST=0.0.0.0
EXPOSE 8080

# Comando de inicio de la aplicación
CMD ["java", "-jar", "/app/quarkus-run.jar"]
