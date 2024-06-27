//gcloud compute ssh redis-vm --zone=europe-west2-b -- -N -L 6379:10.244.57.243:6379

resource "google_redis_instance" "bet_redis_store" {
  name           = "bet-redis-store"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = "europe-west2"
  redis_version  = "REDIS_6_X"
  authorized_network = google_compute_network.network.name
}


resource "google_compute_network" "network" {
  name = "redis-network"
}



resource "google_compute_instance" "redis-vm" {
  name         = "redis-vm"
  machine_type = "e2-small"  // Adjust as needed
  zone         = "europe-west2-b"
  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-10"
    }
  }
  network_interface {
    network = google_compute_network.network.id
    //subnetwork = google_compute_subnetwork.subnet.name
    access_config {}
  }
  metadata_startup_script = "sudo apt-get update && sudo apt-get install redis-server -y"
}


# Firewall rule to allow SSH traffic from VM to Redis Forwarder VM
resource "google_compute_firewall" "allow_ssh" {
  name    = "allow-ssh"
  network = google_compute_network.network.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]  # Adjust to restrict to specific IP ranges if needed
}

resource "google_compute_firewall" "allow-redis-access" {
  name    = "allow-redis-access"
  network = google_compute_network.network.name

  allow {
    protocol = "tcp"
    ports    = ["6379"]
  }

  source_ranges = ["0.0.0.0/0"]  // Restrict this to your specific IP range for security
}

output "host" {
 description = "Redis ID Address"
 value = "${google_redis_instance.bet_redis_store.host}"
}

output "port" {
 description = "Redis Port"
 value = "${google_redis_instance.bet_redis_store.port}"
}
