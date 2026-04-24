FROM jenkins/jenkins:lts-jdk17

USER root

# Install Docker CLI
RUN apt-get update && apt-get install -y \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

# Install plugins
COPY plugins.txt /usr/share/jenkins/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/plugins.txt

# Copy JCasC configuration
COPY casc.yaml /var/jenkins_home/casc.yaml

# Set Jenkins Configuration as Code environment variable
ENV CASC_JENKINS_CONFIG=/var/jenkins_home/casc.yaml

# Switch back to jenkins user
USER jenkins

# Set Java options to skip setup wizard
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"
