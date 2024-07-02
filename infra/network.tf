module "vpc" {
  source = "terraform-google-modules/network/google"

  project_id   = var.project
  network_name = var.application
  routing_mode = "GLOBAL"

  subnets = [
    {
      subnet_name   = local.subnet_name
      subnet_ip     = var.subnet_ip
      subnet_region = var.region
    },
  ]

  secondary_ranges = {
    "${local.subnet_name}" = [
      {
        range_name    = "${var.subnet_name}-pod-cidr"
        ip_cidr_range = var.pod_cidr
      },
      {
        range_name    = "${var.subnet_name}-svc1-cidr"
        ip_cidr_range = var.svc1_cidr
      },
      {
        range_name    = "${var.subnet_name}-svc2-cidr"
        ip_cidr_range = var.svc2_cidr
      },
    ]
  }

  firewall_rules = [
  // GKE Firewall Rules
  {
    name        = "${var.application}-allow-all-10"
    description = "Allow Pod to Pod connectivity"
    direction   = "INGRESS"
    ranges      = ["10.0.0.0/8"]
    allow = [{
      protocol = "tcp"
      ports    = ["0-65535"]
    }]
  },
  // SSH Connection for VMs
  {
    name        = "${var.application}-allow-ssh-vm"
    description = "Allow SSH Connectivity"
    direction   = "INGRESS"
    ranges      = ["0.0.0.0/0"] 
    allow = [{
      protocol = "tcp"   
      ports    = ["22"] // SSH
    }]
  },
  ]
}