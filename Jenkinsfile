pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        COMPOSE_PROJECT_NAME = 'volt'
        DOCKER_BUILDKIT = '1'
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Cloning repository..."
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[url: 'https://github.com/AmirUzak/volt_store.git']]
                ])
            }
        }

        stage('Build') {
            steps {
                withCredentials([file(credentialsId: 'volt-env-file', variable: 'ENV_FILE')]) {
                    sh 'cp $ENV_FILE .env'
                    sh 'docker compose build --no-cache'
                }
            }
        }

        stage('Test') {
            steps {
                withCredentials([file(credentialsId: 'volt-env-file', variable: 'ENV_FILE')]) {
                    sh 'cp $ENV_FILE .env'
                    sh 'docker compose up -d postgres redis'
                    sh 'sleep 15'
                    sh 'docker compose run --rm backend npx prisma migrate deploy || true'
                    sh 'echo "No tests configured, skipping"'
                }
            }
        }

        stage('Deploy') {
            when { branch 'main' }
            steps {
                withCredentials([file(credentialsId: 'volt-env-file', variable: 'ENV_FILE')]) {
                    sh 'cp $ENV_FILE .env'
                    sh 'docker compose down --remove-orphans || true'
                    sh 'docker compose up -d --build'
                    sh 'sleep 30'
                    sh 'docker compose exec -T backend npx prisma migrate deploy || true'
                    sh 'docker compose ps'
                }
            }
        }

        stage('Notify') {
            when { branch 'main' }
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    withCredentials([string(credentialsId: 'telegram-bot-token', variable: 'TG_TOKEN')]) {
                        sh """
                            curl -s -X POST https://api.telegram.org/bot\${s}/sendMessage \
                                -d chat_id=8716415209 \
                                -d text="✅ VOLT Store deployed — build #${env.BUILD_NUMBER}"
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker compose ps || true'
            sh 'docker system prune -f || true'
        }
        failure {
            sh 'docker compose logs > build-logs.txt 2>&1 || true'
            archiveArtifacts artifacts: 'build-logs.txt', allowEmptyArchive: true
        }
    }
}