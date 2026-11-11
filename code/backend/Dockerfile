# Backend-Image für den Pi (linux/arm64) und jeden anderen Docker-Host. Gebaut wird es von compose.yaml
# (docker compose build backend), Ablauf in docu/setup.md, Abschnitt 5.16.
#
# Stufe 1 baut das Jar mit dem JDK, Stufe 2 enthält nur das JRE, das Jar und die Werkzeuge der Auswertung:
# Tesseract (Texterkennung) und libheif (heif-dec, HEIC vom iPhone). Versionen geprüft am 2026-11-08: Temurin
# 25.0.5+8 (neueste stabile 25) auf Ubuntu 26.04 „resolute“, darin libheif 1.21.2 und Tesseract 5.5.0.

FROM eclipse-temurin:25.0.5_8-jdk-resolute AS build
WORKDIR /build
# Erst nur die Abhängigkeiten: Diese Schicht bleibt im Cache, solange sich die pom.xml nicht ändert
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -q -B dependency:go-offline
COPY src/ src/
# Ohne Tests: Die brauchen Postgres, Solr und SFTP und laufen beim Entwickeln auf dem Mac
RUN ./mvnw -q -B -DskipTests package && cp target/gebiter9k-*.jar /build/app.jar

FROM eclipse-temurin:25.0.5_8-jre-resolute
RUN apt-get update \
	&& apt-get install -y --no-install-recommends tesseract-ocr libheif-examples \
	&& rm -rf /var/lib/apt/lists/*
# Läuft als uid 1001 wie docker-dummy auf dem Pi: Dem gehören die Bind-Mounts, z. B. der Upload-Puffer
RUN useradd --uid 1001 --no-create-home --shell /usr/sbin/nologin gebiter
WORKDIR /app
COPY --from=build /build/app.jar /app/app.jar
USER 1001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
