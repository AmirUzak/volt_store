variable "postgres_db" {
  description = "PostgreSQL database name"
  type        = string
  default     = "volt_db"
}

variable "postgres_user" {
  description = "PostgreSQL username"
  type        = string
  default     = "volt_app"
}

variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
  default     = "changeme"
}
