terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {
  host = "unix:///var/run/docker.sock"
}

# PostgreSQL
resource "docker_container" "postgres" {
  name  = "tf-volt-postgres"
  image = docker_image.postgres.image_id

  env = [
    "POSTGRES_DB=${var.postgres_db}",
    "POSTGRES_USER=${var.postgres_user}",
    "POSTGRES_PASSWORD=${var.postgres_password}"
  ]

  ports {
    internal = 5432
    external = 5434
  }

  networks_advanced {
    name = docker_network.volt_network.name
  }
}

resource "docker_image" "postgres" {
  name = "postgres:16-alpine"
}

# Redis
resource "docker_container" "redis" {
  name  = "tf-volt-redis"
  image = docker_image.redis.image_id

  networks_advanced {
    name = docker_network.volt_network.name
  }
}

resource "docker_image" "redis" {
  name = "redis:7-alpine"
}

# Network
resource "docker_network" "volt_network" {
  name = "tf-volt-network"
}
