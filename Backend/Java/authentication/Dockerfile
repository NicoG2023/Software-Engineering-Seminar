# ===== Build (opcional si construyes fuera) =====
# Puedes compilar fuera con ./gradlew build -Dquarkus.package.type=fast-jar
# y usar sólo la imagen "runner" de abajo.

# ===== Runner =====
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copia el paquete generado por Gradle
# Tras: ./gradlew build -Dquarkus.package.type=fast-jar
COPY build/quarkus-app/ /app/

EXPOSE 8080
CMD ["java", "-jar", "/app/quarkus-run.jar"]
