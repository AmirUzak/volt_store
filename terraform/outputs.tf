output "postgres_container" {
  description = "PostgreSQL container name"
  value       = docker_container.postgres.name
}

output "redis_container" {
  description = "Redis container name"
  value       = docker_container.redis.name
}

output "network_name" {
  description = "Docker network name"
  value       = docker_network.volt_network.name
}
