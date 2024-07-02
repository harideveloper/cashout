//gcloud compute ssh redis-vm --zone=europe-west2-b -- -N -L 6379:10.244.57.243:6379

resource "google_redis_instance" "bet_redis_store" {
  name           = "bet-redis-store"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = "europe-west2"
  redis_version  = "REDIS_6_X"
}

output "host" {
 description = "Redis ID Address"
 value = "${google_redis_instance.bet_redis_store.host}"
}

output "port" {
 description = "Redis Port"
 value = "${google_redis_instance.bet_redis_store.port}"
}
