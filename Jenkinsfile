pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        COMPOSE_PROJECT_NAME = 'volt'
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

        stage('Deploy') {
            steps {
                sh '''
                    if [ ! -d /root/volt_store ]; then
                        echo "ERROR: /root/volt_store is not mounted into Jenkins container"
                        exit 1
                    fi

                    cd /root/volt_store
                    git fetch origin main
                    git checkout main
                    git pull --ff-only origin main
                    docker compose -p "$COMPOSE_PROJECT_NAME" --profile prod up -d --build backend frontend nginx
                    sleep 10
                    docker compose -p "$COMPOSE_PROJECT_NAME" exec -T backend npx prisma migrate deploy || true
                    docker compose -p "$COMPOSE_PROJECT_NAME" ps
                '''
            }
        }
    }

    post {
        always {
            sh 'cd /root/volt_store && docker compose -p "$COMPOSE_PROJECT_NAME" ps || true'
        }
    }
}