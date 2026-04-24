pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        DOCKER_BUILDKIT = '1'
    }

    stages {
        stage('Checkout') {
            steps {
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
                    sh 'docker-compose build backend frontend nginx'
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    for name in volt-backend volt-frontend volt-nginx volt-certbot; do
                        docker stop $name 2>/dev/null || true
                        docker rm $name 2>/dev/null || true
                    done
                '''
                sh 'docker-compose --profile prod up -d --no-deps backend frontend nginx certbot'
                sh 'sleep 20'
                sh 'docker-compose exec -T backend npx prisma migrate deploy || true'
                sh 'docker-compose ps'
            }
        }
    }

    post {
        always {
            sh 'docker-compose ps || true'
        }
        failure {
            sh 'docker-compose logs backend > build-logs.txt 2>&1 || true'
            archiveArtifacts artifacts: 'build-logs.txt', allowEmptyArchive: true
        }
    }
}
