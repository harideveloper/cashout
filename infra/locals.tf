locals {
  machine_type = "n2-standard-2" // e2-medium
  node_count   = 1
  subnet_name  = "${var.application}-${var.subnet_name}"
}