# ===== Builder =====
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# Copiamos solo lo necesario para cachear dependencias
COPY gradlew ./gradlew
COPY gradle ./gradle
COPY build.gradle settings.gradle ./
RUN chmod +x gradlew

# (Opcional pero recomendado) habilita BuildKit y cachea ~/.gradle
# Descarga dependencias sin compilar todo
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon dependencies || true

# Ahora sí copiamos el código
COPY src ./src

# Construimos fast-jar (lo más simple y portable)
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon clean build -Dquarkus.package.type=fast-jar

# ===== Runner =====
FROM eclipse-temurin:21-jre AS runner
WORKDIR /app

# Copiamos el paquete construido
COPY --from=build /workspace/build/quarkus-app/ /app/

# Asegura que escuche en todas las interfaces dentro del contenedor
ENV QUARKUS_HTTP_HOST=0.0.0.0

EXPOSE 8080
CMD ["java", "-jar", "/app/quarkus-run.jar"]
