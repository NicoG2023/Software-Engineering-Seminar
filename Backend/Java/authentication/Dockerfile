# ===== Builder =====
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# Copiamos wrapper + metadata para cachear
COPY gradlew ./gradlew
COPY gradle ./gradle
COPY build.gradle settings.gradle gradle.properties ./
# Si tienes versión catalog:
# COPY gradle/libs.versions.toml gradle/libs.versions.toml

RUN chmod +x gradlew

# Descarga dependencias (usa cache)
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon dependencies || true

# Ahora el código
COPY src ./src

# Build fast-jar
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon clean build -Dquarkus.package.type=fast-jar

# ===== Runner =====
FROM eclipse-temurin:21-jre AS runner
WORKDIR /app
COPY --from=build /workspace/build/quarkus-app/ /app/
ENV QUARKUS_HTTP_HOST=0.0.0.0
EXPOSE 8080
CMD ["java", "-jar", "/app/quarkus-run.jar"]
